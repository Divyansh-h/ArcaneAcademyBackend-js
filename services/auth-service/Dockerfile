# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -w @arcane/shared
WORKDIR /app/services/auth-service
RUN npm run build

# Remove devDependencies to reduce size
WORKDIR /app
RUN npm prune --production

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy root node_modules (with pruned dev deps)
COPY --from=builder /app/node_modules ./node_modules
# Copy shared library built artifacts
COPY --from=builder /app/services/shared/dist ./services/shared/dist
COPY --from=builder /app/services/shared/package.json ./services/shared/package.json
# Copy service built artifacts
COPY --from=builder /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder /app/services/auth-service/package.json ./services/auth-service/package.json

WORKDIR /app/services/auth-service
EXPOSE 3001
CMD ["node", "dist/index.js"]
