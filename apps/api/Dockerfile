FROM oven/bun:1.3.3-alpine AS base
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

FROM base AS prepare
RUN bun add -g turbo@^2 dbmate@^2
COPY . .
RUN turbo prune "@todo-docker/api" --docker

FROM prepare AS migrate
COPY --from=prepare /app/apps/api/db/ ./db
CMD ["dbmate", "up"]

FROM base AS builder
COPY --from=prepare /app/out/json/ .
COPY --from=prepare /app/out/bun.lock ./bun.lock

RUN bun ci
COPY --from=prepare /app/out/full/ .
RUN bun turbo build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/todo-docker-api ./todo-docker-api

EXPOSE 3000
CMD ["./todo-docker-api"]
