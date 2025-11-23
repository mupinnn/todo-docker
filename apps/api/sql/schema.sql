create extension if not exists "uuid-ossp";

create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create table if not exists todos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  task text not null,
  is_complete boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null
);
