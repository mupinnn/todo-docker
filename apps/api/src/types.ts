import { type JwtVariables } from "hono/jwt";
import { type JWTPayload } from "hono/utils/jwt/types";

export type User = {
  id: string;
  email: string;
  password: string;
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

export type RefreshToken = {
  id: string;
  hashed_token: string;
  ip: string | null;
  user_agent: string | null;
  user_id: string;
  expired_at: string;
  created_at: string;
  updated_at: string | null;
};

export type AppVariables = JwtVariables<{ sub: string } & JWTPayload>;
