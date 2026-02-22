import { type JwtVariables } from "hono/jwt";
import { type JWTPayload } from "hono/utils/jwt/types";

export type User = {
  id: string;
  email: string;
  password: string;
  refresh_token: string | null;
  created_at: string;
  updated_at: string | null;
};

export type Todo = {
  id: string;
  user_id: string;
  task: string;
  is_complete: boolean;
  created_at: string;
  updated_at: string | null;
};

export type AppVariables = JwtVariables<{ sub: string } & JWTPayload>;
