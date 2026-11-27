import { effectiveRole, isWerewolfRole } from "./roles";
import type { CardPositions, Player, PlayerId, Role, WinResult } from "./types";

export function roleAtEnd(
  positions: CardPositions,
  playerId: PlayerId,
  doppelgangerCopy: Role | null,
): Role {
  const card = positions.players[playerId];
  if (!card) throw new Error("Unknown player.");
  return effectiveRole(card, doppelgangerCopy);
}

export function werewolfPlayerIds(
  players: Player[],
  positions: CardPositions,
  doppelgangerCopy: Role | null,
): PlayerId[] {
  return players
    .filter((player) =>
      isWerewolfRole(roleAtEnd(positions, player.id, doppelgangerCopy)),
    )
    .map((player) => player.id);
}

export function minionPlayerIds(
  players: Player[],
  positions: CardPositions,
  doppelgangerCopy: Role | null,
): PlayerId[] {
  return players
    .filter(
      (player) => roleAtEnd(positions, player.id, doppelgangerCopy) === "minion",
    )
    .map((player) => player.id);
}

export function tannerPlayerIds(
  players: Player[],
  positions: CardPositions,
  doppelgangerCopy: Role | null,
): PlayerId[] {
  return players
    .filter(
      (player) => roleAtEnd(positions, player.id, doppelgangerCopy) === "tanner",
    )
    .map((player) => player.id);
}

export function resolveWins(args: {
  players: Player[];
  current: CardPositions;
  doppelgangerCopy: Role | null;
  deaths: PlayerId[];
}): WinResult {
  const { players, current, doppelgangerCopy, deaths } = args;
  const werewolves = werewolfPlayerIds(players, current, doppelgangerCopy);
  const minions = minionPlayerIds(players, current, doppelgangerCopy);
  const tanners = tannerPlayerIds(players, current, doppelgangerCopy);
  const werewolvesAmongPlayers = werewolves.length > 0;
  // House rule: the village needs every Werewolf among the players dead,
  // not just one of them.
  const allWerewolvesDied = werewolves.every((id) => deaths.includes(id));
  const tannerDied = deaths.some((id) => tanners.includes(id));
  const nobodyDied = deaths.length === 0;
  const someoneOtherThanMinionDied = deaths.some((id) => !minions.includes(id));

  const reasons: string[] = [];
  let village = false;
  let werewolf = false;
  const tanner = tannerDied;

  if (tannerDied) {
    reasons.push("The Tanner died, so the Tanner wins.");
  }

  if (werewolvesAmongPlayers) {
    const wolfWord = werewolves.length === 1 ? "The Werewolf" : `All ${werewolves.length} Werewolves`;
    if (allWerewolvesDied) {
      village = true;
      werewolf = false;
      reasons.push(`${wolfWord} died, so the village team wins.`);
    } else if (tannerDied) {
      village = false;
      werewolf = false;
      reasons.push(
        "The Tanner died and a Werewolf survived, so neither the village nor the werewolf team wins.",
      );
    } else {
      village = false;
      werewolf = true;
      reasons.push(
        werewolves.length === 1
          ? "The Werewolf survived, so the werewolf team wins."
          : "Not every Werewolf died, so the werewolf team wins.",
      );
    }
  } else if (nobodyDied) {
    village = true;
    werewolf = false;
    reasons.push(
      "No player is a Werewolf and nobody died, so the village team wins.",
    );
  } else {
    village = false;
    reasons.push(
      "No player is a Werewolf, but someone died, so the village team loses.",
    );
    if (someoneOtherThanMinionDied && minions.length > 0) {
      werewolf = true;
      reasons.push(
        "No player is a Werewolf and someone other than the Minion died, so the Minion (werewolf team) wins.",
      );
    } else {
      werewolf = false;
    }
  }

  return { village, werewolf, tanner, reasons };
}
