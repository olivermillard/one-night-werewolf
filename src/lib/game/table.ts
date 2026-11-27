import { shuffle, type Rng } from "./deal";
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

/**
 * Cards are dealt face down onto the table and each player taps one to take
 * it. Once everyone has a card, the untaken three become the center.
 */
export function createTableState(
  players: Player[],
  deck: Role[],
  rng: Rng = Math.random,
  houseRules: HouseRules = DEFAULT_HOUSE_RULES,
): GameState {
  if (deck.length !== players.length + 3) {
    throw new Error("Deck must contain player count + 3 cards.");
  }
  const slots = shuffle(deck, rng);
  // Placeholder until every card is claimed; see finishTable().
  const original: CardPositions = {
    players: {},
    center: [slots[0], slots[1], slots[2]] as [Role, Role, Role],
  };
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
    table: { slots, claims: slots.map(() => null) },
  };
}

/** True once every player has taken a card (or for games dealt the old way). */
export function tableIsComplete(state: GameState): boolean {
  if (!state.table) return true;
  return state.players.every((player) => claimedSlot(state, player.id) !== null);
}

export function claimedSlot(state: GameState, playerId: PlayerId): number | null {
  const index = state.table?.claims.indexOf(playerId) ?? -1;
  return index === -1 ? null : index;
}

export function claimCard(
  state: GameState,
  playerId: PlayerId,
  slot: number,
): GameState {
  const table = state.table;
  if (!table) throw new Error("The cards have already been taken.");
  if (!state.players.some((player) => player.id === playerId)) {
    throw new Error("Unknown player.");
  }
  if (!Number.isInteger(slot) || slot < 0 || slot >= table.slots.length) {
    throw new Error("That card isn't on the table.");
  }
  if (claimedSlot(state, playerId) !== null) {
    throw new Error("You already took a card.");
  }
  if (table.claims[slot]) {
    throw new Error("Someone just took that card. Pick another.");
  }
  const claims = [...table.claims];
  claims[slot] = playerId;
  const next: GameState = { ...state, table: { ...table, claims } };
  return tableIsComplete(next) ? finishTable(next) : next;
}

/** Everyone has a card: fix who holds what, and the untaken three are the center. */
function finishTable(state: GameState): GameState {
  const table = state.table!;
  const players: Record<PlayerId, Role> = {};
  const center: Role[] = [];
  table.slots.forEach((role, index) => {
    const holder = table.claims[index];
    if (holder) players[holder] = role;
    else center.push(role);
  });
  if (center.length !== 3) throw new Error("The center must have exactly 3 cards.");
  const original: CardPositions = {
    players,
    center: center as [Role, Role, Role],
  };
  return { ...state, original, current: clonePositions(original) };
}
