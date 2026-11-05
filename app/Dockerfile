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
# bundle is already built and `serve` only hands out static files. Passing them
# as build args (and promoting them to ENV so `npm run build` sees them) is what
# actually gets them into the bundle.
#
# Defaults keep a plain `docker build` working with the self-contained browser
# backend; override them to point at Supabase.
ARG VITE_DATA_BACKEND=local
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_LINKEDIN_CLIENT_ID
ARG VITE_LOG_PAYMENTS

ENV VITE_DATA_BACKEND=$VITE_DATA_BACKEND \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID \
    VITE_LINKEDIN_CLIENT_ID=$VITE_LINKEDIN_CLIENT_ID \
    VITE_LOG_PAYMENTS=$VITE_LOG_PAYMENTS

# Anything inlined here ships inside the public JS bundle and is readable by
# anyone who loads the site. Only ever pass the Supabase *anon* key, which is
# designed to be public and constrained by RLS — never the service role key.

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
