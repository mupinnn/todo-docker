import { randomBytes } from "node:crypto";
import { Hono } from "hono";
import { getConnInfo } from "hono/bun";
import { sign } from "hono/jwt";
import { getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { sql } from "./db";
import { env } from "./env";
import type { User, RefreshToken } from "./types";

const authSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be 6 characters length."),
});

const createAccessToken = async (user: User) => {
  return await sign(
    {
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + env.JWT_TTL_SECONDS,
    },
    env.JWT_SECRET,
    "HS256",
  );
};

const hashToken = (token: string) => {
  const hasher = new Bun.CryptoHasher("sha512");
  return hasher.update(token).digest("hex");
};

const createRefreshToken = () => {
  const refreshToken = randomBytes(16).toString("base64url");
  const hashedRefreshToken = hashToken(refreshToken);
  const refreshTokenExpiredAt = new Date(
    Date.now() + 1000 * env.REFRESH_TOKEN_TTL_SECONDS,
  );

  return { refreshToken, hashedRefreshToken, refreshTokenExpiredAt };
};

export const authRoutes = new Hono()
  .post("/register", zValidator("json", authSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    try {
      const hashedPassword = await Bun.password.hash(password);
      await sql`insert into users (email, password) values (${email}, ${hashedPassword})`;

      return c.json({ message: "Successfully registered!" });
    } catch {
      return c.json({ message: "Something went wrong." }, 500);
    }
  })
  .post("/login", zValidator("json", authSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const connInfo = getConnInfo(c);

    try {
      const [user]: [User?] =
        await sql`select * from users where email = ${email}`;
      if (!user) return c.json({ message: "Invalid credentials." }, 401);

      const isPasswordValid = await Bun.password.verify(
        password,
        user.password,
      );
      if (!isPasswordValid)
        return c.json({ message: "Invalid credentials" }, 401);

      const accessToken = await createAccessToken(user);
      const { refreshToken, hashedRefreshToken, refreshTokenExpiredAt } =
        createRefreshToken();

      await sql`
        insert into refresh_tokens (hashed_token, ip, user_agent, user_id, expired_at) 
        values (${hashedRefreshToken}, ${connInfo.remote.address ?? null}, ${c.req.header("User-Agent") ?? null}, ${user.id}, ${refreshTokenExpiredAt})
      `;

      setCookie(c, "access_token", accessToken, {
        path: "/",
        httpOnly: true,
        secure: true,
        maxAge: env.JWT_TTL_SECONDS,
        domain: new URL(env.CORS_ORIGIN).hostname,
        sameSite: "lax",
      });

      setCookie(c, "refresh_token", refreshToken, {
        path: "/",
        httpOnly: true,
        secure: true,
        maxAge: env.REFRESH_TOKEN_TTL_SECONDS,
        domain: new URL(env.CORS_ORIGIN).hostname,
        sameSite: "lax",
      });

      return c.json({ message: "Successfully logged in!" });
    } catch {
      return c.json({ message: "Something went wrong." }, 500);
    }
  })
  .post("/refresh", async (c) => {
    const refreshToken = getCookie(c, "refresh_token");

    try {
      if (!refreshToken)
        return c.json({ message: "Missing refresh token." }, 400);

      const [savedRefreshToken]: [RefreshToken?] =
        await sql`select * from refresh_tokens where hashed_token = ${hashToken(refreshToken)}`;
      if (
        !savedRefreshToken ||
        Date.now() >= new Date(savedRefreshToken.expired_at).getTime()
      ) {
        return c.json({ message: "Unauthorized." }, 401);
      }

      const [user]: [User?] =
        await sql`select * from users where id = ${savedRefreshToken.user_id}`;
      if (!user) {
        return c.json({ message: "Unauthorized." }, 401);
      }

      const accessToken = await createAccessToken(user);
      const {
        refreshToken: newRefreshToken,
        hashedRefreshToken,
        refreshTokenExpiredAt,
      } = createRefreshToken();

      await sql`
        update refresh_tokens set hashed_token = ${hashedRefreshToken}, expired_at = ${refreshTokenExpiredAt}, updated_at = ${new Date()}
        where id = ${savedRefreshToken.id}
      `;

      setCookie(c, "access_token", accessToken, {
        path: "/",
        httpOnly: true,
        secure: true,
        maxAge: env.JWT_TTL_SECONDS,
        domain: new URL(env.CORS_ORIGIN).hostname,
        sameSite: "lax",
      });

      setCookie(c, "refresh_token", newRefreshToken, {
        path: "/",
        httpOnly: true,
        secure: true,
        maxAge: env.REFRESH_TOKEN_TTL_SECONDS,
        domain: new URL(env.CORS_ORIGIN).hostname,
        sameSite: "lax",
      });

      return c.json({ message: "Successfully refreshing session." });
    } catch {
      return c.json({ message: "Something went wrong." }, 500);
    }
  });
