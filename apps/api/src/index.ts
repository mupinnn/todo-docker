import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt, type JwtVariables } from "hono/jwt";
import { env } from "./env";
import { authRoutes } from "./auth";
import { todoRoutes } from "./todos";

type Variables = JwtVariables<{ sub: string }>;

const app = new Hono<{ Variables: Variables }>();

app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(
  "/api/*",
  jwt({ cookie: "access_token", secret: env.JWT_SECRET, alg: "HS256" }),
);

const routes = app
  .get("/health", (c) => c.json({ status: "ok", db: env.DATABASE_URL }))
  .route("/auth", authRoutes)
  .route("/api/todos", todoRoutes);

export type Api = typeof routes;
export default app;
