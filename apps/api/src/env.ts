import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres/ }),
  CORS_ORIGIN: z.url({ protocol: /^https?$/ }),
  JWT_SECRET: z.string(),
});

export const env = envSchema.parse(Bun.env);
