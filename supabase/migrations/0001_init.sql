create table public.cards (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  title           text not null default '',
  company         text not null default '',
  email           text not null default '',
  phone           text not null default '',
  website         text not null default '',
  category        text not null default 'Other',
  ai_description  text not null default '',
  user_notes      text not null default '',
  accent          text,
  captured_at     timestamptz not null default now()
);

create index cards_user_captured_idx on public.cards (user_id, captured_at desc);

alter table public.cards enable row level security;

create policy "cards_select_own" on public.cards for select using (auth.uid() = user_id);
create policy "cards_insert_own" on public.cards for insert with check (auth.uid() = user_id);
create policy "cards_update_own" on public.cards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cards_delete_own" on public.cards for delete using (auth.uid() = user_id);

grant select, insert, update, delete on public.cards to authenticated;
