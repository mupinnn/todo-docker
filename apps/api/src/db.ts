import postgres from "postgres";
import { env } from "./env";

type SQLClient = ReturnType<typeof postgres>;

export const sql: SQLClient = postgres(env.DATABASE_URL);
