# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install system dependencies if needed (e.g. for native modules)
RUN apt-get update && apt-get install -y python3 make g++

COPY package*.json ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Set high memory limit for the build process
ENV NODE_OPTIONS="--max-old-space-size=8192"

# Run the full build pipeline
# This will use the simplified vite config we just set up
RUN npm run build:all

# Stage 2: Runtime
# We use wrangler to serve the Pages application locally, simulating the Edge environment
FROM node:20-slim

WORKDIR /app

# Install wrangler globally or ensure it's in node_modules
RUN npm install -g wrangler

# Copy build artifacts and necessary config
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/wrangler.toml ./wrangler.toml
COPY --from=builder /app/node_modules ./node_modules

# Expose Wrangler's port
EXPOSE 8788

# Start the application in local mode
CMD ["wrangler", "pages", "dev", "dist", "--ip", "0.0.0.0", "--port", "8788", "--no-show-interactive-dev-session"]
