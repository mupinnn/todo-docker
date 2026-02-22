-- migrate:up
CREATE TABLE refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hashed_token text NOT NULL UNIQUE,
  ip inet,
  user_agent text,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expired_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz
);

-- migrate:down
DROP TABLE refresh_tokens;
