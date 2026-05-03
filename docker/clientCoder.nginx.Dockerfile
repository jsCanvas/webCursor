# syntax=docker/dockerfile:1.7
# Build context：webCursor 根目录（仅此目录内资源）
FROM node:20-bookworm-slim AS build
WORKDIR /build/clientCoder
COPY clientCoder/package.json clientCoder/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY clientCoder/ ./
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/clientCoder.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/clientCoder/dist /usr/share/nginx/html
EXPOSE 80
