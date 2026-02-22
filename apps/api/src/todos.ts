import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as z from "zod";
import { sql } from "./db";
import type { AppVariables, Todo } from "./types";

export const todoRoutes = new Hono<{ Variables: AppVariables }>()
  .get("/", async (c) => {
    const jwtPayload = c.get("jwtPayload");
    const todos = await sql<
      Todo[]
    >`select * from todos where user_id = ${jwtPayload.sub} order by created_at desc`;

    return c.json({ todos: todos as Todo[] });
  })
  .post(
    "/",
    zValidator("json", z.object({ task: z.string().min(1) })),
    async (c) => {
      const { task } = c.req.valid("json");
      const todos =
        await sql`insert into todos (user_id, task) values (${c.get("jwtPayload").sub}, ${task}) returning *`;

      return c.json(todos[0], 201);
    },
  )
  .patch(
    "/:id",
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
        await sql`update todos set ${sql(updatedData)} where id = ${c.req.param("id")} and user_id = ${c.get("jwtPayload").sub} returning *`;

      if (todos.length === 0) return c.json({ message: "Todo not found" }, 404);

      return c.json(todos[0]);
    },
  )
  .delete("/:id", async (c) => {
    const todos = await sql`
    DELETE FROM todos
    WHERE id = ${c.req.param("id")} AND user_id = ${c.get("jwtPayload").sub}
    RETURNING id
  `;

    if (todos.length === 0) {
      return c.json({ error: "Todo not found" }, 404);
    }

    return c.json({ message: "Todo deleted successfully" });
  });
