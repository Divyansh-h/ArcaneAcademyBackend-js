# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -w @arcane/shared
WORKDIR /app/services/grading-service
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
COPY --from=builder /app/services/grading-service/dist ./services/grading-service/dist
COPY --from=builder /app/services/grading-service/package.json ./services/grading-service/package.json

WORKDIR /app/services/grading-service
EXPOSE 3004
CMD ["node", "dist/index.js"]
