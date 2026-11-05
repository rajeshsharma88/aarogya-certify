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
ARG VITE_DATA_BACKEND
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

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start the app
CMD ["serve", "-s", "dist", "-l", "3000"]
