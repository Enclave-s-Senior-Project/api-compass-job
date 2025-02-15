# Base image
FROM node:20 AS base

# Install pnpm globally
RUN npm i -g pnpm

# Install dependencies
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# 🔥 Disable Husky to avoid issues
ENV HUSKY=0  

RUN pnpm install --frozen-lockfile

# Build stage
FROM dependencies AS build
WORKDIR /app
COPY . .  

# 🔥 Disable Husky again just in case
ENV HUSKY=0  

RUN pnpm build  
RUN pnpm prune --prod || echo "Skipping prune due to errors"

# Deploy stage
FROM node:20-alpine AS deploy
WORKDIR /app

# Copy build files & dependencies
COPY --from=build /app/dist ./dist
COPY --from=dependencies /app/node_modules ./node_modules

CMD ["node", "dist/main.js"]
