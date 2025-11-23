import { Hono } from "hono";
import { env as envAdapter } from "hono/adapter";
import { contextStorage, getContext } from "hono/context-storage";
import { cors } from "hono/cors";
import { sign, jwt } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import postgres from "postgres";

type Bindings = {
  DATABASE_URL: string;
  CORS_ORIGIN: string;
  JWT_SECRET: string;
};

type Context = {
  Bindings: Bindings;
};

type SQLClient = ReturnType<typeof postgres>;

const env = envAdapter(getContext<Context>());
const sql: SQLClient = postgres(env.DATABASE_URL);
const app = new Hono<Context>();

const authSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be 6 characters length"),
});

app.use(contextStorage());
app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use("/api/*", jwt({ secret: env.JWT_SECRET }));

const routes = app
  .get("/health", (c) => c.json({ status: "ok" }))
  .post("/api/auth/register", zValidator("json", authSchema), async (c) => {
    const { email, password } = c.req.valid("json");

    try {
      const hashedPassword = await Bun.password.hash(password);
      await sql`insert into users (email, password) values (${email}, ${hashedPassword})`;

      return c.json({ message: "Successfully registered!" });
    } catch (error) {
      if (error instanceof postgres.PostgresError) {
        console.log(error);
      }

      return c.json({ message: "Internal server error" }, 500);
    }
  })
  .post("/auth/login", zValidator("json", authSchema), async (c) => {
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
      return c.json({ message: "Internal server error" }, 500);
    }
  })
  .get("/api/todos", async (c) => {
    const jwtPayload = c.get("jwtPayload");
    const todos =
      await sql`select * from todos where user_id = ${jwtPayload.userId} order by created_at desc`;

    return c.json(todos);
  })
  .post(
    "/api/todos",
    zValidator("json", z.object({ task: z.string().min(1) })),
    async (c) => {
      const { task } = c.req.valid("json");
      const todos =
        await sql`inser into todos (user_id, task) values (${c.get("jwtPayload").userId}, ${task}) returning *`;

      return c.json(todos[0], 201);
    },
  )
  .patch(
    "/api/todos/:id",
    zValidator(
      "json",
      z.object({
        task: z.string().min(1).optional(),
        is_complete: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const { task, is_complete } = c.req.valid("json");
      const updatedData: { task?: string; is_complete?: boolean } = {};

      if (task !== undefined) updatedData.task = task;
      if (is_complete !== undefined) updatedData.is_complete = is_complete;
      if (Object.keys(updatedData).length === 0)
        return c.json({ message: "No fields to update" }, 400);

      const todos =
        await sql`update todos set ${sql(updatedData)} where id = ${c.req.param("id")} and user_id = ${c.get("jwtPayload").userId} returning *`;

      if (todos.length === 0) return c.json({ message: "Todo not found" }, 404);

      return c.json(todos[0]);
    },
  )
  .delete("/api/todos/:id", async (c) => {
    const todos = await sql`
    DELETE FROM todos
    WHERE id = ${c.req.param("id")} AND user_id = ${c.get("jwtPayload").userId}
    RETURNING id
  `;

    if (todos.length === 0) {
      return c.json({ error: "Todo not found" }, 404);
    }

    return c.json({ message: "Todo deleted successfully" });
  });

export type Api = typeof routes;

export default app;
