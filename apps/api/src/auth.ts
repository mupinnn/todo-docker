import { Hono } from "hono";
import { sign } from "hono/jwt";
import { setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { sql } from "./db";
import { env } from "./env";
import type { User } from "./types";

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

      setCookie(c, "access_token", accessToken, {
        path: "/",
        httpOnly: true,
        secure: true,
        maxAge: env.JWT_TTL_SECONDS,
        domain: new URL(env.CORS_ORIGIN).hostname,
        sameSite: "lax",
      });

      return c.json({ message: "Successfully logged in!" });
    } catch {
      return c.json({ message: "Something went wrong." }, 500);
    }
  });
