# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Frontend configuration must be present at BUILD time, not run time.
# Vite replaces every `import.meta.env.VITE_*` with a literal while bundling, so
# values supplied only as container environment variables arrive too late: the
# bundle is already built and `serve` only hands out static files.
#
# Each arg is written to .env.production ONLY when non-empty. An unset arg must
# never become an empty ENV, because that would shadow configuration the build
# platform already supplies its own way (Coolify, for example, injects a .env
# into the build context) and silently downgrade the app to the local backend.
# Defaults to supabase because the production deployment relies on this default
# rather than passing the value explicitly. Safe everywhere else: without a URL
# and anon key, createProvider() logs a warning and falls back to the local
# browser backend, exactly as an unset value would.
ARG VITE_DATA_BACKEND=supabase
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_LINKEDIN_CLIENT_ID
ARG VITE_LOG_PAYMENTS

# Anything inlined here ships inside the public JS bundle and is readable by
# anyone who loads the site. Only ever pass the Supabase *anon* key, which is
# designed to be public and constrained by RLS — never the service role key.
RUN set -eu; \
    for v in VITE_DATA_BACKEND VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY \
             VITE_RAZORPAY_KEY_ID VITE_LINKEDIN_CLIENT_ID VITE_LOG_PAYMENTS; do \
      eval "val=\${$v-}"; \
      if [ -n "$val" ]; then echo "$v=$val" >> .env.production; fi; \
    done; \
    if [ -f .env.production ]; then \
      echo 'Build-time VITE_* keys supplied as build args:'; cut -d= -f1 .env.production; \
    else \
      echo 'No VITE_* build args supplied; using .env from the build context, if any.'; \
    fi

# Build the app
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install serve to run the production build
RUN npm install -g serve

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Copy package files
COPY package*.json ./

# Expose port
EXPOSE 3000

# Health check.
#
# This previously ran:
#   node -e "require('http').get('http://localhost:3000', (r) => {...})"
# which received its 200 and then hung: the response body was never consumed and
# the process never exited, so Docker killed it at the timeout and reported
# `Return code: -1` on every attempt. The container was serving correctly the
# whole time — the deployment log showed `GET / Returned 200 in 3 ms` for each
# probe — but Docker marked it unhealthy and Coolify rolled the deploy back.
#
# wget exits on its own and sets a status code, which is also what Coolify's
# deploy warning asks for on Dockerfile-based deployments. busybox wget is part
# of the alpine base image, so nothing extra is installed.
#
# `localhost` rather than 127.0.0.1 deliberately: the logged probes arrived from
# ::1, so serve is answering over IPv6 here, and forcing IPv4 risks a refusal.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO /dev/null http://localhost:3000/ || exit 1

# Start the app
CMD ["serve", "-s", "dist", "-l", "3000"]
