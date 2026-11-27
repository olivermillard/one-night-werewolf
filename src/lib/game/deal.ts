import { clonePositions } from "./positions";
import {
  DEFAULT_HOUSE_RULES,
  type CardPositions,
  type GameState,
  type HouseRules,
  type Player,
  type PlayerId,
  type Role,
} from "./types";

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const current = copy[i];
    const swap = copy[j];
    if (current === undefined || swap === undefined) {
      throw new Error("Shuffle index out of range.");
    }
    copy[i] = swap;
    copy[j] = current;
  }
  return copy;
}

export function deal(
  deck: Role[],
  playerIds: PlayerId[],
  rng: Rng = Math.random,
): CardPositions {
  if (deck.length !== playerIds.length + 3) {
    throw new Error("Deck must contain player count + 3 cards.");
  }
  const shuffled = shuffle(deck, rng);
  const players: Record<PlayerId, Role> = {};
  playerIds.forEach((id, index) => {
    const role = shuffled[index];
    if (!role) throw new Error("Missing dealt role.");
    players[id] = role;
  });
  const center = shuffled.slice(playerIds.length, playerIds.length + 3) as [
    Role,
    Role,
    Role,
  ];
  return { players, center };
}

export function createDealtState(
  players: Player[],
  deck: Role[],
  rng: Rng = Math.random,
  houseRules: HouseRules = DEFAULT_HOUSE_RULES,
): GameState {
  const original = deal(
    deck,
    players.map((player) => player.id),
    rng,
  );
  return {
    players,
    deck: [...deck],
    original,
    current: clonePositions(original),
    doppelgangerCopy: null,
    nightStep: "doppelganger_copy",
    pendingActorIds: [],
    acknowledgedIds: [],
    nightLog: [],
    flashes: {},
    votes: {},
    deaths: [],
    winners: null,
    houseRules: { ...houseRules },
  };
}
