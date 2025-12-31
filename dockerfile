# Use a specific Node version for stability
FROM node:22.12.0-bookworm-slim

# Security: Set production environment
ENV NODE_ENV=production
WORKDIR /app

# Install curl for healthcheck purposes
RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Copy dependency definitions
COPY package.json ./
# Clean install of production dependencies only
RUN npm install --omit=dev

# Copy the bridge source code
COPY mcp-bridge.js ./

# Create data directories and set correct permissions
RUN mkdir -p /data/documents /data/memory && \
    chown -R node:node /app /data

# Use the non-root 'node' user provided by the official image
USER node

EXPOSE 5000 5001

CMD ["node", "mcp-bridge.js"]
