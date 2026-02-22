import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt, type JwtVariables } from "hono/jwt";
import { env } from "./env";
import { authRoutes } from "./auth";
import { todoRoutes } from "./todos";
import { sql } from "./db";
import type { User } from "./types";

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
  .route("/api/todos", todoRoutes)
  .get("/api/profile", async (c) => {
    const jwtPayload = c.get("jwtPayload");
    const [profile]: [User?] =
      await sql`select * from users where id = ${jwtPayload.sub}`;

    if (!profile) return c.json({ message: "Profile not found." }, 404);

    return c.json({ profile });
  });

export type Api = typeof routes;
export default app;
