-- House rule: the village wins only if every Werewolf held by a player dies.
-- On by default; the host can switch back to the official rule (one dead
-- Werewolf is enough) in the lobby. Public, like the deck and day timer.

alter table public.rooms
  add column if not exists all_werewolves_must_die boolean not null default true;
