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

## Room to improve

- Multi-stage build
- HMR and dev; right now i didn't set it up because the image right now is for production.
