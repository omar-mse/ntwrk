create table public.user_categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  accent     text not null,
  created_at timestamptz not null default now(),
  unique(user_id, name)
);

alter table public.user_categories enable row level security;

create policy "user_categories_select_own" on public.user_categories for select using (auth.uid() = user_id);
create policy "user_categories_insert_own" on public.user_categories for insert with check (auth.uid() = user_id);
create policy "user_categories_delete_own" on public.user_categories for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.user_categories to authenticated;

create policy "user_categories_update_own" on public.user_categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
