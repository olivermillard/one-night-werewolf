-- Host setting: which sound plays on every phone when the last vote is in.
-- One of: horn, bell, gong, howl, drums, none. Public, like the deck.

alter table public.rooms
  add column if not exists end_sound text not null default 'horn';
