
FROM node:20 AS base


RUN npm i -g pnpm

FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./


ENV HUSKY=0  

RUN pnpm install --frozen-lockfile

FROM dependencies AS build
WORKDIR /app
COPY . .  


ENV HUSKY=0  

RUN pnpm build  
RUN pnpm prune --prod || echo "Skipping prune due to errors"


FROM node:20-alpine AS deploy
WORKDIR /app

ENV NODE_ENV=production

RUN npm i -g pnpm

COPY --from=build /app/dist ./dist
COPY --from=dependencies /app/node_modules ./node_modules
COPY package.json ./


CMD ["node", "dist/main.js"]
