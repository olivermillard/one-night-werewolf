import { describe, expect, it } from "vitest";
import { createDealtState, deal, recommendedDeck, shuffle } from "./index";
import { playersOf } from "./test-helpers";

describe("deal", () => {
  it("deals one card per player and three to the center", () => {
    const players = playersOf("A", "B", "C");
    const deck = recommendedDeck(3);
    let i = 0;
    const rng = () => {
      i += 1;
      return (i % 10) / 10;
    };
    const dealt = deal(
      deck,
      players.map((p) => p.id),
      rng,
    );
    expect(Object.keys(dealt.players)).toHaveLength(3);
    expect(dealt.center).toHaveLength(3);
    expect([...Object.values(dealt.players), ...dealt.center].sort()).toEqual(
      [...deck].sort(),
    );
  });

  it("createDealtState copies original into current", () => {
    const players = playersOf("A", "B", "C");
    const state = createDealtState(players, recommendedDeck(3), () => 0.2);
    expect(state.current).toEqual(state.original);
    expect(state.doppelgangerCopy).toBeNull();
  });

  it("shuffle is a permutation", () => {
    const items = [1, 2, 3, 4, 5];
    const shuffled = shuffle(items, () => 0.3);
    expect([...shuffled].sort()).toEqual(items);
  });
});
