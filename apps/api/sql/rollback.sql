-- rollback with `psql -d todo-docker -f api/sql/schema.sql`

drop table if exists todos cascade;
drop table if exists users cascade;
