import { roleAtEnd } from "./win";
import type {
  CardPositions,
  Player,
  PlayerId,
  Role,
  WinResult,
} from "./types";
import { resolveWins } from "./win";

/** Each player may vote for up to this many other players. */
export const MAX_VOTES_PER_PLAYER = 2;

export type Votes = Record<PlayerId, PlayerId[]>;

export interface VoteResolution {
  tally: Record<PlayerId, number>;
  deaths: PlayerId[];
  winners: WinResult;
}

/**
 * Normalise stored votes. Older games stored a single target per voter as a
 * string; newer ones store a list.
 */
export function normalizeVotes(raw: unknown): Votes {
  const votes: Votes = {};
  if (!raw || typeof raw !== "object") return votes;
  for (const [voter, value] of Object.entries(raw as Record<string, unknown>)) {
    const targets = Array.isArray(value) ? value : [value];
    const clean = targets.filter(
      (target): target is string => typeof target === "string" && target.length > 0,
    );
    if (clean.length) votes[voter] = clean;
  }
  return votes;
}

/** Returns an error message, or null if the ballot is valid. */
export function validateBallot(
  voterId: PlayerId,
  targets: PlayerId[],
  playerIds: PlayerId[],
): string | null {
  if (targets.length < 1) return "Pick at least one player.";
  if (targets.length > MAX_VOTES_PER_PLAYER) {
    return `You can vote for at most ${MAX_VOTES_PER_PLAYER} players.`;
  }
  if (new Set(targets).size !== targets.length) {
    return "Pick different players.";
  }
  if (targets.includes(voterId)) return "You cannot vote for yourself.";
  if (targets.some((target) => !playerIds.includes(target))) {
    return "Unknown player.";
  }
  return null;
}

export function tallyVotes(players: Player[], votes: Votes): Record<PlayerId, number> {
  const tally: Record<PlayerId, number> = {};
  for (const player of players) {
    tally[player.id] = 0;
  }
  for (const voter of players) {
    const targets = new Set(votes[voter.id] ?? []);
    for (const target of targets) {
      if (target === voter.id || !(target in tally)) continue;
      tally[target] = (tally[target] ?? 0) + 1;
    }
  }
  return tally;
}

export function initialDeathsFromVotes(players: Player[], votes: Votes): PlayerId[] {
  const tally = tallyVotes(players, votes);
  const max = Math.max(0, ...Object.values(tally));
  if (max < 2) return [];
  return players.filter((player) => tally[player.id] === max).map((p) => p.id);
}

export function applyHunterDeaths(args: {
  players: Player[];
  current: CardPositions;
  doppelgangerCopy: Role | null;
  votes: Votes;
  deaths: PlayerId[];
}): PlayerId[] {
  const deaths = new Set(args.deaths);
  let changed = true;
  while (changed) {
    changed = false;
    for (const player of args.players) {
      if (!deaths.has(player.id)) continue;
      const role = roleAtEnd(args.current, player.id, args.doppelgangerCopy);
      if (role !== "hunter") continue;
      // A dying Hunter takes everyone they voted for with them.
      for (const target of args.votes[player.id] ?? []) {
        if (!deaths.has(target)) {
          deaths.add(target);
          changed = true;
        }
      }
    }
  }
  return args.players.filter((player) => deaths.has(player.id)).map((p) => p.id);
}

export function resolveVotes(args: {
  players: Player[];
  current: CardPositions;
  doppelgangerCopy: Role | null;
  votes: Votes;
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
