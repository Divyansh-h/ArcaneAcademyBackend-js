# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -w @arcane/shared
WORKDIR /app/services/user-service
RUN npm run build

# Remove devDependencies to reduce size
WORKDIR /app
RUN npm prune --production

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy root node_modules
COPY --from=builder /app/node_modules ./node_modules
# Copy shared library
COPY --from=builder /app/services/shared/dist ./services/shared/dist
COPY --from=builder /app/services/shared/package.json ./services/shared/package.json
# Copy service
COPY --from=builder /app/services/user-service/dist ./services/user-service/dist
COPY --from=builder /app/services/user-service/package.json ./services/user-service/package.json

WORKDIR /app/services/user-service
EXPOSE 3002
CMD ["node", "dist/index.js"]
