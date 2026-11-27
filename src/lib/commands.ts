import type { NightAction, Role } from "@/lib/game";

export type Command =
  | { type: "settings"; deck: Role[]; dayTimerSeconds: number }
  | { type: "start" }
  | { type: "ready" }
  | { type: "begin-night" }
  | { type: "night-action"; action: NightAction }
  | { type: "dismiss-flash" }
  | { type: "start-vote" }
  | { type: "vote"; targetPlayerId: string }
  | { type: "kick"; playerId: string }
  | { type: "restart" }
  | { type: "tick" };
