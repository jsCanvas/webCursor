# syntax=docker/dockerfile:1.7
# 仅复制预编译 dist + 生产依赖（webCursor/dockerBot 不含 TypeScript 源码）。
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 build-essential ca-certificates \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      docker.io \
      docker-compose \
      git \
      openssh-client \
 && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY dist ./dist
COPY package.json ./package.json
EXPOSE 8080
CMD ["node", "dist/main.js"]
