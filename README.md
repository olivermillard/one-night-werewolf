# Oliver's One Night Werewolf

> An unofficial fan project, made for playing with friends. Free, with no ads. Not affiliated with or endorsed by Bézier Games. One Night Ultimate Werewolf is a trademark of Bézier Games. The card art, sounds and rules text here are original to this project.

A mobile-first web app for a one-night werewolf party game. Each player uses their own phone. The host creates a room, players join with a short code, and the night order, swaps, votes, and wins are resolved on the server.

Hidden information (roles, center cards, night actions, votes before reveal) is stored in Postgres tables that **Row Level Security denies to the anon key**. The browser only talks to Next.js API routes, which use the Supabase service role.

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Supabase (Postgres + Realtime)
- Vitest for the pure rules engine
- Deployable on Vercel

## 1. Apply the Supabase migration

In the [Supabase dashboard](https://supabase.com/dashboard/project/gdtbovckkxgeexexfgak) (project ref `gdtbovckkxgeexexfgak`):

1. Open **SQL Editor**.
2. Paste and run `supabase/migrations/0001_init.sql` (or use the Supabase CLI: `supabase db push` after linking the project).
3. Confirm these tables exist: `rooms`, `players`, `player_auth`, `game_secrets`.
4. Confirm **Realtime** is enabled for `rooms` and `players` (the migration adds them to `supabase_realtime`).

The migration:

- Enables RLS on every table
- Allows `anon` / `authenticated` **SELECT** only on `rooms` and `players` (lobby names, phase, selected roles, day timer)
- Revokes all access to `player_auth` and `game_secrets` for `anon` / `authenticated`
- Writes happen only through this app’s API routes with `SUPABASE_SERVICE_ROLE_KEY`

## 2. Environment variables

Copy `.env.example` to `.env.local` for local development.

| Variable | Where it is used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | `https://gdtbovckkxgeexexfgak.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Realtime + public reads | Publishable / anon key. RLS blocks hidden state. |
| `SUPABASE_SERVICE_ROLE_KEY` | Next.js API routes only | **Secret.** Never prefix with `NEXT_PUBLIC_`. |

Get the keys from **Project Settings → API**. Do not commit real keys.

## 3. Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Create a room on one phone (or browser), join from others with the room code or `/r/CODE`.

```bash
npm test
npm run lint
npm run build
```

## 4. Deploy on Vercel

1. Import this GitHub repo in Vercel.
2. Framework preset: **Next.js**.
3. Set these **exactly three** environment variables for Production (and Preview if you want preview deploys to work):

   - `NEXT_PUBLIC_SUPABASE_URL` = `https://gdtbovckkxgeexexfgak.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon / publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key

4. Deploy. No other env vars are required.
5. After deploy, open the Vercel URL on phones. iOS Safari and Android Chrome are the target browsers.

## How a round works

1. **Lobby** — Host shares the room code / link. Host picks a deck of **player count + 3** cards (recommended presets included) and a day timer.
2. **Deal** — Each phone can tap to reveal / hide **only that player’s original card**.
3. **Night** — Official base order: Doppelgänger, Werewolves, Minion, Masons, Seer, Robber, Troublemaker, Drunk, Insomniac, Doppelgänger-Insomniac. Acting phones get a tap UI; everyone else sees a neutral “eyes closed” screen. Roles that exist only in the center still consume a short random delay so timing does not leak. Swaps are applied in server state.
4. **Day** — Shared countdown from `day_ends_at`. Players may look at their **original** card, not the current one.
5. **Vote** — Simultaneous vote for someone else. Votes stay hidden until everyone has voted.
6. **Reveal** — Deaths, winners, original vs final cards (including center), and a night log. Host can **Play again** with the same room.

Host can kick players in the lobby and restart after a game. Identity is stored in `localStorage` so refresh / reconnect works.

## Rules engine

All night resolution, Doppelgänger cases, swaps, voting (including Hunter), and win conditions live in `src/lib/game/` and are covered by Vitest. The API is an orchestration layer over that module.

## Rule edge cases decided here

- Night actions are performed by the player **dealt** that role (plus a Doppelgänger who copied a group/immediate role), not by whoever currently holds the card after a later swap. That matches the physical game: you wake because of the card you saw at dusk.
- If the Doppelgänger copies Seer / Robber / Troublemaker / Drunk, they do that action **immediately** and do not wake again when that role is called. The original role still acts at its normal time.
- A player who later receives the Doppelgänger card is treated as the **copied** role for teams and wins. The physical card is still revealed as Doppelgänger.
- Lone Wolf applies when exactly one player wakes as Werewolf (original Werewolf holders + Doppelgänger-Werewolf). Copying a player Werewolf means both of those players wake, even if the other Werewolf card is in the center.
- Seer, Robber, Troublemaker, and Lone Wolf **may skip**. Drunk **must** swap with a center card.
- Hunter deaths chain: if a dying Hunter’s vote target is also a Hunter (possible when Doppelgänger copied Hunter), that Hunter’s vote target also dies.
- Tanner dying with no Werewolf among the players: Tanner wins, village loses (Tanner is not on the village team). If a Minion is among the players and someone other than the Minion dies, the Minion / werewolf team also wins.
- Masons are recommended as a pair; a single Mason is allowed but warned in the lobby.
- Player count is 3–10, matching the base box.

Official card illustrations are not included (copyright). Each role has an original card-style layout plus the official rules text.
