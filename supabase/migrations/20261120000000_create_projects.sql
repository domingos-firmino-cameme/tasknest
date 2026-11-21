create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text check (description is null or char_length(description) <= 1000),
  status text not null default 'planning'
    check (status in ('planning', 'in_progress', 'completed')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_created_at_idx
  on public.projects (owner_id, created_at desc);

create index if not exists projects_owner_status_idx
  on public.projects (owner_id, status);

alter table public.projects enable row level security;
revoke all on public.projects from anon;
grant select, insert, update, delete on public.projects to authenticated;

create policy "Users can read their own projects"
  on public.projects
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Users can create their own projects"
  on public.projects
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Users can update their own projects"
  on public.projects
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Users can delete their own projects"
  on public.projects
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

create or replace function public.set_project_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_project_updated_at
  before update on public.projects
  for each row
  execute function public.set_project_updated_at();
