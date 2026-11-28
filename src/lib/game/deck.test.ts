import { describe, expect, it } from "vitest";
import {
  ALL_ROLE_CARDS,
  ROLE_COPIES,
  hardValidateDeck,
  recommendedDeck,
  requiredCardCount,
  validateDeck,
} from "./index";
import { ROLES } from "./types";

describe("deck", () => {
  it("contains 16 base-game cards plus 4 custom ones", () => {
    expect(ALL_ROLE_CARDS).toHaveLength(20);
    const total = ROLES.reduce((sum, role) => sum + ROLE_COPIES[role], 0);
    expect(total).toBe(20);
  });

  it("requires player count + 3 cards", () => {
    expect(requiredCardCount(5)).toBe(8);
  });

  it("recommended presets match player count + 3", () => {
    for (let n = 3; n <= 10; n += 1) {
      const deck = recommendedDeck(n);
      expect(hardValidateDeck(deck, n)).toEqual([]);
      expect(deck).toHaveLength(n + 3);
    }
  });

  it("3-player preset is the official beginner set", () => {
    expect(recommendedDeck(3)).toEqual([
      "werewolf",
      "werewolf",
      "seer",
      "robber",
      "troublemaker",
      "villager",
    ]);
  });

  it("rejects the wrong number of cards", () => {
    const errors = validateDeck(["werewolf", "seer"], 3);
    expect(errors.some((error) => error.includes("exactly 6"))).toBe(true);
  });

  it("rejects too many copies of a role", () => {
    const deck: Array<"werewolf" | "seer"> = [
      "werewolf",
      "werewolf",
      "werewolf",
      "seer",
      "seer",
      "seer",
    ];
    const errors = hardValidateDeck(deck, 3);
    expect(errors.some((error) => error.includes("Too many"))).toBe(true);
  });
});
