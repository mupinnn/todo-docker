import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt } from "hono/jwt";
import { env } from "./env";
import { authRoutes } from "./auth";
import { todoRoutes } from "./todos";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use("/api/*", jwt({ secret: env.JWT_SECRET, alg: "HS256" }));

const routes = app
  .get("/health", (c) => c.json({ status: "ok", db: env.DATABASE_URL }))
  .route("/auth", authRoutes)
  .route("/api/todos", todoRoutes);

export type Api = typeof routes;
export default app;
