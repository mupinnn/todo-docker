FROM oven/bun:1.3.3-alpine as builder

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/

RUN bun install --filter '@todo-docker/web'

COPY apps/web ./apps/web

RUN cd apps/web && NODE_ENV=production bun run build

FROM nginx:alpine-slim

COPY apps/web/nginx /etc/nginx/conf.d
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
