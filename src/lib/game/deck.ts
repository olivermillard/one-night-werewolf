import { ROLE_COPIES } from "./roles";
import { ROLES, type Role } from "./types";

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;
export const CENTER_COUNT = 3;

export function requiredCardCount(playerCount: number): number {
  return playerCount + CENTER_COUNT;
}

const BEGINNER_3: Role[] = [
  "werewolf",
  "werewolf",
  "seer",
  "robber",
  "troublemaker",
  "villager",
];

export function recommendedDeck(playerCount: number): Role[] {
  switch (playerCount) {
    case 3:
      return [...BEGINNER_3];
    case 4:
      return [...BEGINNER_3, "villager"];
    case 5:
      return [...BEGINNER_3, "villager", "villager"];
    case 6:
      return [
        "werewolf",
        "werewolf",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
        "villager",
        "villager",
      ];
    case 7:
      return [
        "werewolf",
        "werewolf",
        "minion",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
        "villager",
        "villager",
      ];
    case 8:
      return [
        "werewolf",
        "werewolf",
        "minion",
        "mason",
        "mason",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
        "villager",
      ];
    case 9:
      return [
        "werewolf",
        "werewolf",
        "minion",
        "mason",
        "mason",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
        "hunter",
        "villager",
      ];
    case 10:
      return [
        "werewolf",
        "werewolf",
        "minion",
        "mason",
        "mason",
        "seer",
        "robber",
        "troublemaker",
        "drunk",
        "insomniac",
        "hunter",
        "tanner",
        "doppelganger",
      ];
    default:
      return padDeck([...BEGINNER_3], playerCount);
  }
}

function padDeck(base: Role[], playerCount: number): Role[] {
  const needed = requiredCardCount(playerCount);
  const deck = [...base];
  const extras: Role[] = [
    "villager",
    "insomniac",
    "drunk",
    "minion",
    "mason",
    "mason",
    "hunter",
    "tanner",
    "doppelganger",
  ];
  for (const role of extras) {
    if (deck.length >= needed) break;
    const used = deck.filter((item) => item === role).length;
    if (used < ROLE_COPIES[role]) deck.push(role);
  }
  return deck.slice(0, needed);
}

export function countRoles(deck: Role[]): Record<Role, number> {
  const counts = Object.fromEntries(ROLES.map((role) => [role, 0])) as Record<
    Role,
    number
  >;
  for (const role of deck) {
    counts[role] += 1;
  }
  return counts;
}

export function validateDeck(deck: Role[], playerCount: number): string[] {
  const errors: string[] = [];
  if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
    errors.push(`Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}.`);
  }
  const needed = requiredCardCount(playerCount);
  if (deck.length !== needed) {
    errors.push(
      `Select exactly ${needed} cards (players + 3 center cards). You selected ${deck.length}.`,
    );
  }
  const counts = countRoles(deck);
  for (const role of ROLES) {
    if (counts[role] > ROLE_COPIES[role]) {
      errors.push(
        `Too many ${role} cards (${counts[role]}; max ${ROLE_COPIES[role]}).`,
      );
    }
  }
  if (counts.mason === 1) {
    errors.push(MASON_PAIR_WARNING);
  }
  if (counts.mad_seer > 0 && counts.seer === 0) {
    errors.push(MAD_SEER_WARNING);
  }
  return errors;
}

export const MASON_PAIR_WARNING = "Masons should be included as a pair.";
export const MAD_SEER_WARNING =
  "The Mad Seer is meant to be played with a Seer. Without one, whoever sees a Seer card can tell they're mad.";

/** Advice the host may ignore: these never block the deal. */
export const SOFT_DECK_WARNINGS = [MASON_PAIR_WARNING, MAD_SEER_WARNING];

export function hardValidateDeck(deck: Role[], playerCount: number): string[] {
  return validateDeck(deck, playerCount).filter(
    (error) => !SOFT_DECK_WARNINGS.includes(error),
  );
}

export function isLegalDeck(deck: Role[], playerCount: number): boolean {
  return hardValidateDeck(deck, playerCount).length === 0;
}
