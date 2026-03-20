import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwt, type JwtVariables } from "hono/jwt";
import { deleteCookie, getCookie } from "hono/cookie";
import { UAParser } from "ua-parser-js";
import { env } from "./env";
import { authRoutes, hashToken, getDomain } from "./auth";
import { todoRoutes } from "./todos";
import { sql } from "./db";
import type { User, RefreshToken } from "./types";

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
  .route("/auth", authRoutes)
  .route("/api/todos", todoRoutes)
  .get("/api/profile", async (c) => {
    const jwtPayload = c.get("jwtPayload");
    const [profile]: [User?] =
      await sql`select * from users where id = ${jwtPayload.sub}`;

    if (!profile) return c.json({ message: "Profile not found." }, 404);

    return c.json({ profile });
  })
  .get("/api/sessions", async (c) => {
    const jwtPayload = c.get("jwtPayload");
    const currentRefreshToken = getCookie(c, "refresh_token");
    const sessions = await sql<
      RefreshToken[]
    >`select * from refresh_tokens where user_id = ${jwtPayload.sub}`;

    let currentHashedRefreshToken: string | null;
    if (currentRefreshToken) {
      currentHashedRefreshToken = hashToken(currentRefreshToken);
    }

    const mappedSessions = sessions
      .map((session) => ({
        ...session,
        user_agent: UAParser(session.user_agent || ""),
        is_current:
          currentHashedRefreshToken !== null &&
          session.hashed_token === currentHashedRefreshToken,
      }))
      .sort((session) => {
        if (session.is_current) return -1;
        return 1;
      });

    return c.json({ sessions: mappedSessions });
  })
  .delete("/api/sessions/:sessionId", async (c) => {
    const sessionId = c.req.param("sessionId");
    const jwtPayload = c.get("jwtPayload");
    const currentRefreshToken = getCookie(c, "refresh_token");
    const [session]: [RefreshToken?] =
      await sql`select * from refresh_tokens where user_id = ${jwtPayload.sub} and id = ${sessionId}`;

    if (!session)
      return c.json({ message: "Session not found or unauthorized" }, 404);

    await sql`delete from refresh_tokens where id = ${sessionId}`;

    let isCurrentSession = false;
    if (currentRefreshToken) {
      const currentHashedRefreshToken = hashToken(currentRefreshToken);
      if (currentHashedRefreshToken === session.hashed_token)
        isCurrentSession = true;
    }

    if (isCurrentSession) {
      const cookieDomain = getDomain(new URL(env.CORS_ORIGIN).hostname);

      deleteCookie(c, "access_token", {
        path: "/",
        httpOnly: true,
        secure: true,
        maxAge: env.JWT_TTL_SECONDS,
        domain: cookieDomain,
        sameSite: "lax",
      });

      deleteCookie(c, "refresh_token", {
        path: "/",
        httpOnly: true,
        secure: true,
        maxAge: env.REFRESH_TOKEN_TTL_SECONDS,
        domain: cookieDomain,
        sameSite: "lax",
      });
    }

    return c.json({ message: "Session revoked" });
  });

export type Api = typeof routes;
export default app;
