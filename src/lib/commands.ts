import type { EndSoundId } from "@/lib/settings";
import type { NightAction, Role } from "@/lib/game";

export type Command =
  | {
      type: "settings";
      deck: Role[];
      dayTimerSeconds: number;
      allWerewolvesMustDie?: boolean;
      endSound?: EndSoundId;
    }
  | { type: "start" }
  | { type: "claim"; slot: number }
  | { type: "ready" }
  | { type: "begin-night" }
  | { type: "night-action"; action: NightAction }
  | { type: "dismiss-flash" }
  | { type: "start-vote" }
  | { type: "vote"; targetPlayerIds: string[] }
  | { type: "kick"; playerId: string }
  | { type: "restart" }
  | { type: "tick" };
