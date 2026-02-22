import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres/ }),
  CORS_ORIGIN: z.url({ protocol: /^https?$/ }),
  JWT_SECRET: z.string(),
  JWT_TTL_SECONDS: z.coerce.number(),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number(),
});

export const env = envSchema.parse(Bun.env);
