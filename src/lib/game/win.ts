import { effectiveRole, isWerewolfRole } from "./roles";
import {
  DEFAULT_HOUSE_RULES,
  type CardPositions,
  type HouseRules,
  type Player,
  type PlayerId,
  type PoacherMarks,
  type Role,
  type WinResult,
} from "./types";

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
  houseRules?: HouseRules;
  marks?: PoacherMarks;
}): WinResult {
  const { players, current, doppelgangerCopy, deaths } = args;
  const { allWerewolvesMustDie } = args.houseRules ?? DEFAULT_HOUSE_RULES;
  const werewolves = werewolfPlayerIds(players, current, doppelgangerCopy);
  const minions = minionPlayerIds(players, current, doppelgangerCopy);
  const tanners = tannerPlayerIds(players, current, doppelgangerCopy);
  const werewolvesAmongPlayers = werewolves.length > 0;
  const wolvesDead = werewolves.filter((id) => deaths.includes(id)).length;
  // Official rules: one dead Werewolf is enough. House rule: all of them.
  const villageKilledEnough = allWerewolvesMustDie
    ? wolvesDead === werewolves.length
    : wolvesDead > 0;
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
    if (villageKilledEnough) {
      village = true;
      werewolf = false;
      reasons.push(
        !allWerewolvesMustDie
          ? "At least one Werewolf died, so the village team wins."
          : werewolves.length === 1
            ? "The Werewolf died, so the village team wins."
            : `All ${werewolves.length} Werewolves died, so the village team wins.`,
      );
    } else if (tannerDied) {
      village = false;
      werewolf = false;
      reasons.push(
        wolvesDead === 0
          ? "The Tanner died and no Werewolf died, so the werewolf team does not win."
          : "The Tanner died and a Werewolf survived, so neither the village nor the werewolf team wins.",
      );
    } else {
      village = false;
      werewolf = true;
      reasons.push(
        wolvesDead === 0
          ? "No Werewolf died, so the werewolf team wins."
          : "Not every Werewolf died (house rule), so the werewolf team wins.",
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

  // The Poacher is its own side: it wins alongside whoever else wins.
  const poacher = poacherWins({ ...args, marks: args.marks ?? {} });
  if (poacher.length) {
    reasons.push(
      poacher.length === 1
        ? "The Poacher's mark died, so the Poacher wins."
        : "Both Poachers' marks died, so the Poachers win.",
    );
  }

  return { village, werewolf, tanner, poacher: poacher.length > 0, reasons };
}

/**
 * Players who win as a Poacher. The mark goes with the card: whoever holds the
 * Poacher card at the end (or the Doppelgänger card, if it copied the Poacher)
 * wins if that card's mark died.
 */
export function poacherWins(args: {
  players: Player[];
  current: CardPositions;
  doppelgangerCopy: Role | null;
  deaths: PlayerId[];
  marks: PoacherMarks;
}): PlayerId[] {
  const winners: PlayerId[] = [];
  for (const player of args.players) {
    const card = args.current.players[player.id];
    const mark =
      card === "poacher"
        ? args.marks.poacher
        : card === "doppelganger" && args.doppelgangerCopy === "poacher"
          ? args.marks.doppelganger
          : undefined;
    if (mark && args.deaths.includes(mark)) winners.push(player.id);
  }
  return winners;
}
