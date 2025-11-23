FROM oven/bun:1.3.3-alpine

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/

RUN bun install --filter '@todo-docker/api'

COPY apps/api ./apps/api

EXPOSE 3000

ENTRYPOINT ["bun", "run", "apps/api/src/index.ts"]
