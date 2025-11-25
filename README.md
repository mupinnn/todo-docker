# Yup, todo list app with Docker

0. Pull the `bun` image

```sh
docker image pull oven/bun:1.3.3-alpine
```

1. Install dependencies

```sh
bun install

# or

docker run --rm -v "$(pwd):/app" -w /app oven/bun:1.3.3-alpine bun install
```

2. Run

```sh
docker-compose up -d
```

3. Generate the database schema

```sh
cat apps/api/sql/schema.sql | docker exec -i todo-docker-db-1 psql -U todo-docker -d todo_docker -f-

# to confirm
docker exec -it todo-docker-db-1 psql -U todo-docker -d todo_docker
```

## Room to improve

- Multi-stage build
- HMR and dev; right now i didn't set it up because the image right now is for production.
