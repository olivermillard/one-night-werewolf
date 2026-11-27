import type { CalledNightStep } from "@/lib/game/night";
import type {
  FlashReveal,
  NightLogEntry,
  NightPrompt,
  Phase,
  Role,
  WinResult,
} from "@/lib/game";

export interface PublicPlayer {
  id: string;
  name: string;
  isHost: boolean;
  ready: boolean;
}

export interface PublicRoom {
  id: string;
  code: string;
  phase: Phase;
  viewVersion: number;
  players: PublicPlayer[];
  deck: Role[];
  dayTimerSeconds: number;
  dayEndsAt: string | null;
  hostPlayerId: string | null;
  round: number;
}

export interface RevealPayload {
  votes: Record<string, string[]>;
  tally: Record<string, number>;
  deaths: string[];
  winners: WinResult;
  originalPlayers: Record<string, Role>;
  finalPlayers: Record<string, Role>;
  originalCenter: Role[];
  finalCenter: Role[];
  doppelgangerCopy: Role | null;
  nightLog: NightLogEntry[];
}

export interface PrivateView {
  originalRole: Role | null;
  prompt: NightPrompt | null;
  flash: FlashReveal | null;
  eyesClosed: boolean;
  myVotes: string[];
  /** True once this player has voted or skipped. */
  hasVoted: boolean;
  voteCount: number;
  playerCount: number;
  reveal: RevealPayload | null;
}

export interface NightProgress {
  /** Steps the narrator calls for this deck, in order (public). */
  steps: CalledNightStep[];
  /** Index into steps of the step being played; steps.length when done. */
  current: number;
}

export interface GameView {
  room: PublicRoom;
  me: PublicPlayer;
  private: PrivateView;
  night: NightProgress | null;
}

export interface SessionPayload {
  roomCode: string;
  playerId: string;
  token: string;
  name: string;
}
