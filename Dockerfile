# ONE FitGym — Dockerfile for TatNet deployment
# Node.js server serving React SPA + API

FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server and API
COPY server ./server
COPY api ./api
COPY db ./db

# Copy config files
COPY package.json ./

# Expose port
ENV PORT=8787
ENV NODE_ENV=production
EXPOSE 8787

# Start Node.js server
CMD ["node", "server/index.mjs"]
