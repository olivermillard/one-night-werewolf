export const ROLES = [
  "werewolf",
  "minion",
  "mason",
  "seer",
  "robber",
  "troublemaker",
  "drunk",
  "insomniac",
  "villager",
  "hunter",
  "tanner",
  "doppelganger",
] as const;

export type Role = (typeof ROLES)[number];

export type Team = "village" | "werewolf" | "tanner";

export type Phase = "lobby" | "deal" | "night" | "day" | "vote" | "reveal";

export const NIGHT_STEPS = [
  "doppelganger_copy",
  "doppelganger_action",
  "doppelganger_minion",
  "werewolves",
  "minion",
  "masons",
  "seer",
  "robber",
  "troublemaker",
  "drunk",
  "insomniac",
  "doppelganger_insomniac",
  "complete",
] as const;

export type NightStep = (typeof NIGHT_STEPS)[number];

export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
}

export interface CardPositions {
  players: Record<PlayerId, Role>;
  center: [Role, Role, Role];
}

export const IMMEDIATE_COPY_ROLES = [
  "seer",
  "robber",
  "troublemaker",
  "drunk",
] as const;

export type ImmediateCopyRole = (typeof IMMEDIATE_COPY_ROLES)[number];

export type NightAction =
  | { kind: "doppelganger_copy"; targetPlayerId: PlayerId }
  | { kind: "seer_player"; targetPlayerId: PlayerId }
  | { kind: "seer_center"; centerIndexes: [number, number] }
  | { kind: "seer_skip" }
  | { kind: "robber"; targetPlayerId: PlayerId }
  | { kind: "robber_skip" }
  | { kind: "troublemaker"; playerAId: PlayerId; playerBId: PlayerId }
  | { kind: "troublemaker_skip" }
  | { kind: "drunk"; centerIndex: number }
  | { kind: "werewolf_lone"; centerIndex: number }
  | { kind: "werewolf_lone_skip" }
  | { kind: "acknowledge" };

export interface NightLogEntry {
  step: NightStep;
  actorIds: PlayerId[];
  summary: string;
}

export interface FlashReveal {
  title: string;
  body: string;
  roles: Role[];
  playerIds: PlayerId[];
  centerIndexes: number[];
}

export type NightPromptKind =
  | "doppelganger_copy"
  | "seer"
  | "robber"
  | "troublemaker"
  | "drunk"
  | "werewolf_lone"
  | "acknowledge";

export interface NightPrompt {
  kind: NightPromptKind;
  title: string;
  instruction: string;
  playerIds: PlayerId[];
  centerCount: 0 | 1 | 2;
  canSkip: boolean;
  seenPlayerIds: PlayerId[];
  seenRoles: Role[];
  seenCenter: { index: number; role: Role }[];
  ownRole: Role | null;
}

export interface WinResult {
  village: boolean;
  werewolf: boolean;
  tanner: boolean;
  reasons: string[];
}

export interface HouseRules {
  /**
   * Village wins only if every Werewolf held by a player dies. Official rules
   * need just one Werewolf to die.
   */
  allWerewolvesMustDie: boolean;
}

export const DEFAULT_HOUSE_RULES: HouseRules = { allWerewolvesMustDie: true };

export interface GameState {
  players: Player[];
  deck: Role[];
  original: CardPositions;
  current: CardPositions;
  doppelgangerCopy: Role | null;
  nightStep: NightStep;
  pendingActorIds: PlayerId[];
  acknowledgedIds: PlayerId[];
  nightLog: NightLogEntry[];
  flashes: Record<PlayerId, FlashReveal | null>;
  votes: Record<PlayerId, PlayerId[]>;
  deaths: PlayerId[];
  winners: WinResult | null;
  /** Fixed when the cards are dealt. Missing in games saved before it existed. */
  houseRules?: HouseRules;
  /**
   * Face-down cards players pick from at the start. `claims[i]` is the player
   * who took `slots[i]`. Absent in games dealt before picking existed.
   */
  table?: { slots: Role[]; claims: (PlayerId | null)[] };
  /** A tie-break vote in progress (or held), when a tie decides who dies. */
  runoff?: {
    locked: PlayerId[];
    candidates: PlayerId[];
    seats: number;
    votes: Record<PlayerId, PlayerId[]>;
  };
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`);
}
