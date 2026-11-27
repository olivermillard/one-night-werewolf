import { describe, expect, it } from "vitest";
import { beginNight } from "./night";
import { claimCard, claimedSlot, createTableState, tableIsComplete } from "./table";
import { playersOf } from "./test-helpers";
import type { Role } from "./types";

const P = playersOf("Alice", "Bob", "Cara");
const deck: Role[] = ["werewolf", "werewolf", "seer", "robber", "troublemaker", "villager"];
// rng = 0 shuffles deterministically, so slot contents are fixed per test run.
const fresh = () => createTableState(P, deck, () => 0);

describe("picking cards from the table", () => {
  it("lays out every card face down with nothing claimed", () => {
    const state = fresh();
    expect(state.table?.slots).toHaveLength(6);
    expect([...state.table!.slots].sort()).toEqual([...deck].sort());
    expect(state.table?.claims.every((claim) => claim === null)).toBe(true);
    expect(tableIsComplete(state)).toBe(false);
  });

  it("gives each player the card they tap", () => {
    let state = fresh();
    const slots = state.table!.slots;
    state = claimCard(state, "alice", 4);
    expect(claimedSlot(state, "alice")).toBe(4);
    expect(tableIsComplete(state)).toBe(false);
    state = claimCard(state, "bob", 0);
    state = claimCard(state, "cara", 2);
    expect(tableIsComplete(state)).toBe(true);
    expect(state.original.players).toEqual({
      alice: slots[4],
      bob: slots[0],
      cara: slots[2],
    });
    // The untaken cards become the center, in table order.
    expect(state.original.center).toEqual([slots[1], slots[3], slots[5]]);
    expect(state.current).toEqual(state.original);
  });

  it("won't let two players take the same card", () => {
    const state = claimCard(fresh(), "alice", 1);
    expect(() => claimCard(state, "bob", 1)).toThrow(/Someone just took that card/);
  });

  it("won't let a player take two cards", () => {
    const state = claimCard(fresh(), "alice", 1);
    expect(() => claimCard(state, "alice", 2)).toThrow(/already took a card/);
  });

  it("rejects cards that aren't on the table and unknown players", () => {
    expect(() => claimCard(fresh(), "alice", 6)).toThrow(/isn't on the table/);
    expect(() => claimCard(fresh(), "alice", -1)).toThrow(/isn't on the table/);
    expect(() => claimCard(fresh(), "zed", 0)).toThrow(/Unknown player/);
  });

  it("the night runs on the picked cards", () => {
    let state = fresh();
    state = claimCard(state, "alice", 0);
    state = claimCard(state, "bob", 1);
    state = claimCard(state, "cara", 2);
    const night = beginNight(state);
    const slots = state.table!.slots;
    expect(night.original.players.alice).toBe(slots[0]);
    expect(night.nightStep).not.toBe("complete");
  });

  it("treats games dealt before picking existed as already complete", () => {
    const legacy = { ...fresh(), table: undefined };
    expect(tableIsComplete(legacy)).toBe(true);
  });
});

describe("dealing is random", () => {
  it("every card lands in every position about equally often", async () => {
    const { secureRandom } = await import("../server/auth");
    const players = playersOf("A", "B", "C", "D", "E", "F");
    const cards: Role[] = ["werewolf", "werewolf", "seer", "robber", "troublemaker", "villager", "villager", "villager", "insomniac"];
    const deals = 9000;
    // How often each role lands in the first position, and in the last.
    const first: Record<string, number> = {};
    const last: Record<string, number> = {};
    const seen = new Set<string>();
    for (let i = 0; i < deals; i += 1) {
      const slots = createTableState(players, cards, secureRandom).table!.slots;
      first[slots[0]!] = (first[slots[0]!] ?? 0) + 1;
      last[slots[8]!] = (last[slots[8]!] ?? 0) + 1;
      seen.add(slots.join(","));
    }
    for (const role of new Set(cards)) {
      const copies = cards.filter((c) => c === role).length;
      const expected = (deals * copies) / cards.length;
      // Within 15% of the expected share.
      expect(Math.abs(first[role]! - expected) / expected).toBeLessThan(0.15);
      expect(Math.abs(last[role]! - expected) / expected).toBeLessThan(0.15);
    }
    // Thousands of different layouts, not a handful repeating.
    expect(seen.size).toBeGreaterThan(5000);
  });
});
