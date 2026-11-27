import { roleAtEnd } from "./win";
import type {
  CardPositions,
  HouseRules,
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
 * string; newer ones store a list. An empty list means the player skipped.
 */
export function normalizeVotes(raw: unknown): Votes {
  const votes: Votes = {};
  if (!raw || typeof raw !== "object") return votes;
  for (const [voter, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value) && typeof value !== "string") continue;
    const targets = Array.isArray(value) ? value : [value];
    votes[voter] = targets.filter(
      (target): target is string => typeof target === "string" && target.length > 0,
    );
  }
  return votes;
}

/** Whether a player has cast a ballot (skipping counts). */
export function hasVoted(votes: Votes, playerId: PlayerId): boolean {
  return Object.prototype.hasOwnProperty.call(votes, playerId);
}

/** Returns an error message, or null if the ballot is valid. An empty ballot is a skip. */
export function validateBallot(
  voterId: PlayerId,
  targets: PlayerId[],
  playerIds: PlayerId[],
): string | null {
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

/** How many of the top vote-getters die: one per vote each player has. */
export const DEATHS_PER_VOTE = MAX_VOTES_PER_PLAYER;

/**
 * A tie-break vote. Held when a tie decides who dies: everyone gets one vote
 * (or skips), only for the tied players.
 */
export interface Runoff {
  /** Already dying outright (more votes than the tie). */
  locked: PlayerId[];
  /** The tied players; the runoff picks `seats` of them. */
  candidates: PlayerId[];
  seats: number;
  /** One entry per player who has voted: [target] or [] for a skip. */
  votes: Votes;
}

export type DeathPlan =
  | { kind: "decided"; deaths: PlayerId[] }
  | { kind: "runoff"; locked: PlayerId[]; candidates: PlayerId[]; seats: number };

/**
 * The top two vote-getters die, never on fewer than 2 votes. If a tie means
 * we can't tell which two (6-5-5, or 5-5-5), the tied players go to a runoff.
 * 6-5-4 and 5-5-3 need no runoff.
 */
export function planDeaths(players: Player[], votes: Votes): DeathPlan {
  const tally = tallyVotes(players, votes);
  const count = (id: PlayerId) => tally[id] ?? 0;
  const eligible = players.filter((p) => count(p.id) >= 2);
  if (eligible.length <= DEATHS_PER_VOTE) {
    return { kind: "decided", deaths: eligible.map((p) => p.id) };
  }
  const sorted = [...eligible].sort((a, b) => count(b.id) - count(a.id));
  const cutoff = count(sorted[DEATHS_PER_VOTE - 1]!.id);
  const locked = eligible.filter((p) => count(p.id) > cutoff).map((p) => p.id);
  const tied = eligible.filter((p) => count(p.id) === cutoff).map((p) => p.id);
  const seats = DEATHS_PER_VOTE - locked.length;
  if (tied.length <= seats) {
    return { kind: "decided", deaths: [...locked, ...tied] };
  }
  return { kind: "runoff", locked, candidates: tied, seats };
}

export function runoffTally(runoff: Runoff): Record<PlayerId, number> {
  const tally: Record<PlayerId, number> = {};
  for (const id of runoff.candidates) tally[id] = 0;
  for (const [voter, targets] of Object.entries(runoff.votes)) {
    const target = targets[0];
    if (!target || target === voter || !(target in tally)) continue;
    tally[target] = (tally[target] ?? 0) + 1;
  }
  return tally;
}

/**
 * Who the runoff sends to their death: the candidates with the most runoff
 * votes fill the open seats. If it's still tied at the cutoff, everyone
 * still tied dies (as with any tie), so it can never loop.
 */
export function resolveRunoff(runoff: Runoff): PlayerId[] {
  const tally = runoffTally(runoff);
  const count = (id: PlayerId) => tally[id] ?? 0;
  const sorted = [...runoff.candidates].sort((a, b) => count(b) - count(a));
  if (sorted.length <= runoff.seats) return [...runoff.locked, ...sorted];
  const cutoff = count(sorted[runoff.seats - 1]!);
  const chosen = runoff.candidates.filter((id) => count(id) >= cutoff);
  return [...runoff.locked, ...chosen];
}

/** Ballot check for the runoff: one tied player, or a skip. */
export function validateRunoffBallot(
  voterId: PlayerId,
  targets: PlayerId[],
  runoff: Runoff,
): string | null {
  if (targets.length > 1) return "In the tie-break you get one vote.";
  const target = targets[0];
  if (!target) return null;
  if (target === voterId) return "You cannot vote for yourself.";
  if (!runoff.candidates.includes(target)) return "Only the tied players are in the tie-break.";
  return null;
}

/** Deaths from the vote alone (before any Hunter), given the runoff if one was held. */
export function initialDeathsFromVotes(
  players: Player[],
  votes: Votes,
  runoff?: Runoff,
): PlayerId[] {
  const plan = planDeaths(players, votes);
  if (plan.kind === "decided") return plan.deaths;
  if (runoff) return resolveRunoff(runoff);
  // No runoff held (shouldn't happen): everyone tied dies.
  return [...plan.locked, ...plan.candidates];
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
  houseRules?: HouseRules;
  runoff?: Runoff;
}): VoteResolution {
  const tally = tallyVotes(args.players, args.votes);
  const votedDown = initialDeathsFromVotes(args.players, args.votes, args.runoff);
  // Keep the death list in seat order, whichever way it was decided.
  const order = new Map(args.players.map((p, i) => [p.id, i]));
  votedDown.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
  const deaths = applyHunterDeaths({
    ...args,
    deaths: votedDown,
  });
  const winners = resolveWins({
    players: args.players,
    current: args.current,
    doppelgangerCopy: args.doppelgangerCopy,
    deaths,
    houseRules: args.houseRules,
  });
  return { tally, deaths, winners };
}
