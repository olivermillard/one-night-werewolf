import { describe, expect, it } from "vitest";
import { resolveVotes } from "./vote";
import { assignedState, playersOf } from "./test-helpers";

const P = playersOf("Alice", "Bob", "Cara", "Drew");

describe("votes", () => {
  it("kills the player with the most votes when they have at least 2", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "werewolf", bob: "villager", cara: "seer" },
      center: ["werewolf", "robber", "troublemaker"],
    });
    const result = resolveVotes({
      players: state.players,
      current: state.current,
      doppelgangerCopy: null,
      votes: { alice: "bob", bob: "alice", cara: "alice" },
    });
    expect(result.deaths).toEqual(["alice"]);
    expect(result.winners.village).toBe(true);
  });

  it("kills all tied players with the most votes", () => {
    const state = assignedState({
      players: P,
      playerRoles: {
        alice: "werewolf",
        bob: "villager",
        cara: "seer",
        drew: "robber",
      },
      center: ["werewolf", "troublemaker", "drunk"],
    });
    const result = resolveVotes({
      players: state.players,
      current: state.current,
      doppelgangerCopy: null,
      votes: { alice: "bob", bob: "alice", cara: "alice", drew: "bob" },
    });
    expect(result.deaths.sort()).toEqual(["alice", "bob"]);
  });

  it("kills nobody if no player has more than 1 vote", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "werewolf", bob: "villager", cara: "seer" },
      center: ["werewolf", "robber", "troublemaker"],
    });
    const result = resolveVotes({
      players: state.players,
      current: state.current,
      doppelgangerCopy: null,
      votes: { alice: "bob", bob: "cara", cara: "alice" },
    });
    expect(result.deaths).toEqual([]);
    expect(result.winners.werewolf).toBe(true);
  });

  it("hunter death also kills the hunter’s vote target", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "hunter", bob: "werewolf", cara: "villager" },
      center: ["werewolf", "seer", "robber"],
    });
    const result = resolveVotes({
      players: state.players,
      current: state.current,
      doppelgangerCopy: null,
      votes: { alice: "bob", bob: "alice", cara: "alice" },
    });
    expect(result.deaths.sort()).toEqual(["alice", "bob"]);
    expect(result.winners.village).toBe(true);
  });

  it("chained hunters: dying hunter kills a hunter who then kills their target", () => {
    const state = assignedState({
      players: P,
      playerRoles: {
        alice: "hunter",
        bob: "doppelganger",
        cara: "werewolf",
        drew: "villager",
      },
      center: ["werewolf", "seer", "robber"],
    });
    const result = resolveVotes({
      players: state.players,
      current: state.current,
      doppelgangerCopy: "hunter",
      votes: {
        alice: "bob",
        bob: "cara",
        cara: "alice",
        drew: "alice",
      },
    });
    expect(result.deaths.sort()).toEqual(["alice", "bob", "cara"]);
    expect(result.winners.village).toBe(true);
  });
});
