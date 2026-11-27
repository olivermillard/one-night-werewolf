import { roleAtEnd } from "./win";
import type {
  CardPositions,
  Player,
  PlayerId,
  Role,
  WinResult,
} from "./types";
import { resolveWins } from "./win";

export interface VoteResolution {
  tally: Record<PlayerId, number>;
  deaths: PlayerId[];
  winners: WinResult;
}

export function tallyVotes(
  players: Player[],
  votes: Record<PlayerId, PlayerId>,
): Record<PlayerId, number> {
  const tally: Record<PlayerId, number> = {};
  for (const player of players) {
    tally[player.id] = 0;
  }
  for (const voter of players) {
    const target = votes[voter.id];
    if (!target || target === voter.id) continue;
    tally[target] = (tally[target] ?? 0) + 1;
  }
  return tally;
}

export function initialDeathsFromVotes(
  players: Player[],
  votes: Record<PlayerId, PlayerId>,
): PlayerId[] {
  const tally = tallyVotes(players, votes);
  const max = Math.max(0, ...Object.values(tally));
  if (max < 2) return [];
  return players.filter((player) => tally[player.id] === max).map((p) => p.id);
}

export function applyHunterDeaths(args: {
  players: Player[];
  current: CardPositions;
  doppelgangerCopy: Role | null;
  votes: Record<PlayerId, PlayerId>;
  deaths: PlayerId[];
}): PlayerId[] {
  const deaths = new Set(args.deaths);
  let changed = true;
  while (changed) {
    changed = false;
    for (const player of args.players) {
      if (!deaths.has(player.id)) continue;
      const role = roleAtEnd(
        args.current,
        player.id,
        args.doppelgangerCopy,
      );
      if (role !== "hunter") continue;
      const target = args.votes[player.id];
      if (target && !deaths.has(target)) {
        deaths.add(target);
        changed = true;
      }
    }
  }
  return args.players.filter((player) => deaths.has(player.id)).map((p) => p.id);
}

export function resolveVotes(args: {
  players: Player[];
  current: CardPositions;
  doppelgangerCopy: Role | null;
  votes: Record<PlayerId, PlayerId>;
}): VoteResolution {
  const tally = tallyVotes(args.players, args.votes);
  const votedDown = initialDeathsFromVotes(args.players, args.votes);
  const deaths = applyHunterDeaths({
    ...args,
    deaths: votedDown,
  });
  const winners = resolveWins({
    players: args.players,
    current: args.current,
    doppelgangerCopy: args.doppelgangerCopy,
    deaths,
  });
  return { tally, deaths, winners };
}
