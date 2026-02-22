-- migrate:up
CREATE TABLE todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task text NOT NULL,
  is_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz
);

-- migrate:down
DROP TABLE todos;
