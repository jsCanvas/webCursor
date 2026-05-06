# syntax=docker/dockerfile:1.7
# Build context：webCursor 根目录（仅此目录内资源）
FROM node:20-bookworm-slim AS build
WORKDIR /build/phoneCoder
COPY phoneCoder/package.json phoneCoder/package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY phoneCoder/ ./
RUN npx expo export -p web

FROM nginx:1.27-alpine
COPY nginx/phoneCoder.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/phoneCoder/dist /usr/share/nginx/html
EXPOSE 8081
