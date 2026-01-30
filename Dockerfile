# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
# Copy any other necessary files like .env if needed, though usually mounted via docker-compose
# Copy uploads folder structure if needed
RUN mkdir -p uploads/avatars

EXPOSE 4000

CMD ["node", "dist/main"]
