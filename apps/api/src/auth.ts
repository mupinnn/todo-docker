import { Hono } from "hono";
import { sign } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { sql } from "./db";
import { env } from "./env";

const authSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be 6 characters length."),
});

export const authRoutes = new Hono()
  .post("/register", zValidator("json", authSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    try {
      const hashedPassword = await Bun.password.hash(password);
      await sql`insert into users (email, password) values (${email}, ${hashedPassword})`;

      return c.json({ message: "Successfully registered!" });
    } catch (error) {
      console.log(error);
      return c.json({ message: "Internal server error" }, 500);
    }
  })
  .post("/login", zValidator("json", authSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    try {
      const users = await sql`select * from users where email = ${email}`;
      if (users.length === 0)
        return c.json({ message: "Invalid credentials" }, 401);

      const user = users[0];
      const isPasswordValid = await Bun.password.verify(
        password,
        user.password,
      );
      if (!isPasswordValid)
        return c.json({ message: "Invalid credentials" }, 401);

      const token = await sign(
        {
          email,
          userId: user.id,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        env.JWT_SECRET,
      );
      return c.json({ token });
    } catch (error) {
      console.error(error);
      return c.json({ message: "Internal server error" }, 500);
    }
  });
