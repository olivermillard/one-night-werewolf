-- One Night Oliver's Werewolf
-- Fresh-project schema: public lobby tables, hidden game state, RLS, realtime.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  phase text not null default 'lobby'
    check (phase in ('lobby', 'deal', 'night', 'day', 'vote', 'reveal')),
  host_player_id uuid,
  deck jsonb not null default '[]'::jsonb,
  day_timer_seconds integer not null default 300
    check (day_timer_seconds >= 30 and day_timer_seconds <= 1800),
  day_ends_at timestamptz,
  view_version integer not null default 0,
  round integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  is_host boolean not null default false,
  ready boolean not null default false,
  seat integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.rooms
  add constraint rooms_host_player_fk
  foreign key (host_player_id) references public.players (id) on delete set null;

create table public.player_auth (
  player_id uuid primary key references public.players (id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now()
);

create table public.game_secrets (
  room_id uuid primary key references public.rooms (id) on delete cascade,
  state jsonb not null,
  night_advance_at timestamptz,
  updated_at timestamptz not null default now()
);

create index players_room_id_idx on public.players (room_id);
create index rooms_code_idx on public.rooms (code);

create trigger rooms_set_updated_at
  before update on public.rooms
  for each row execute function public.set_updated_at();

create trigger game_secrets_set_updated_at
  before update on public.game_secrets
  for each row execute function public.set_updated_at();

-- RLS: anon/authenticated may only read public lobby fields.
-- Hidden state (roles, center, votes, night log, tokens) is service-role only.
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.player_auth enable row level security;
alter table public.game_secrets enable row level security;

grant usage on schema public to anon, authenticated;

grant select on table public.rooms to anon, authenticated;
grant select on table public.players to anon, authenticated;

revoke all on table public.player_auth from anon, authenticated;
revoke all on table public.game_secrets from anon, authenticated;

create policy rooms_select_public
  on public.rooms
  for select
  to anon, authenticated
  using (true);

create policy players_select_public
  on public.players
  for select
  to anon, authenticated
  using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rooms'
  ) then
    execute 'alter publication supabase_realtime add table public.rooms';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'players'
  ) then
    execute 'alter publication supabase_realtime add table public.players';
  end if;
end;
$$;
