import { describe, expect, it } from "vitest";
import { resolveWins } from "./win";
import { assignedState, playersOf } from "./test-helpers";

const P = playersOf("Alice", "Bob", "Cara");

describe("win resolution", () => {
  it("village wins if the only werewolf among the players dies", () => {
    const result = resolveWins({
      players: P,
      current: assignedState({
        players: P,
        playerRoles: { alice: "werewolf", bob: "villager", cara: "seer" },
        center: ["werewolf", "robber", "troublemaker"],
      }).current,
      doppelgangerCopy: null,
      deaths: ["alice"],
    });
    expect(result).toMatchObject({ village: true, werewolf: false, tanner: false });
  });

  it("village still wins if a villager dies alongside a werewolf", () => {
    const result = resolveWins({
      players: playersOf("Alice", "Bob", "Cara", "Drew"),
      current: assignedState({
        players: playersOf("Alice", "Bob", "Cara", "Drew"),
        playerRoles: {
          alice: "werewolf",
          bob: "villager",
          cara: "seer",
          drew: "robber",
        },
        center: ["werewolf", "troublemaker", "drunk"],
      }).current,
      doppelgangerCopy: null,
      deaths: ["alice", "bob"],
    });
    expect(result.village).toBe(true);
    expect(result.werewolf).toBe(false);
  });

  it("werewolves win if none of them die and one is among players", () => {
    const result = resolveWins({
      players: P,
      current: assignedState({
        players: P,
        playerRoles: { alice: "werewolf", bob: "villager", cara: "seer" },
        center: ["werewolf", "robber", "troublemaker"],
      }).current,
      doppelgangerCopy: null,
      deaths: ["bob"],
    });
    expect(result).toMatchObject({ village: false, werewolf: true, tanner: false });
  });

  it("village wins if no player is a werewolf and nobody dies", () => {
    const result = resolveWins({
      players: P,
      current: assignedState({
        players: P,
        playerRoles: { alice: "villager", bob: "seer", cara: "robber" },
        center: ["werewolf", "werewolf", "troublemaker"],
      }).current,
      doppelgangerCopy: null,
      deaths: [],
    });
    expect(result).toMatchObject({ village: true, werewolf: false });
  });

  it("village loses if no player is a werewolf but someone dies", () => {
    const result = resolveWins({
      players: P,
      current: assignedState({
        players: P,
        playerRoles: { alice: "villager", bob: "seer", cara: "robber" },
        center: ["werewolf", "werewolf", "troublemaker"],
      }).current,
      doppelgangerCopy: null,
      deaths: ["alice"],
    });
    expect(result.village).toBe(false);
    expect(result.werewolf).toBe(false);
  });

  it("minion wins with werewolves even if the minion dies", () => {
    const result = resolveWins({
      players: P,
      current: assignedState({
        players: P,
        playerRoles: { alice: "werewolf", bob: "minion", cara: "villager" },
        center: ["werewolf", "seer", "robber"],
      }).current,
      doppelgangerCopy: null,
      deaths: ["bob"],
    });
    expect(result.werewolf).toBe(true);
    expect(result.village).toBe(false);
  });

  it("minion wins if no werewolves among players and someone else dies", () => {
    const result = resolveWins({
      players: P,
      current: assignedState({
        players: P,
        playerRoles: { alice: "minion", bob: "villager", cara: "seer" },
        center: ["werewolf", "werewolf", "robber"],
      }).current,
      doppelgangerCopy: null,
      deaths: ["bob"],
    });
    expect(result.werewolf).toBe(true);
    expect(result.village).toBe(false);
  });

  it("minion does not win if only the minion dies and no werewolves are among players", () => {
    const result = resolveWins({
      players: P,
      current: assignedState({
        players: P,
        playerRoles: { alice: "minion", bob: "villager", cara: "seer" },
        center: ["werewolf", "werewolf", "robber"],
      }).current,
      doppelgangerCopy: null,
      deaths: ["alice"],
    });
    expect(result.werewolf).toBe(false);
    expect(result.village).toBe(false);
  });

  it("tanner wins if the tanner dies", () => {
    const result = resolveWins({
      players: P,
      current: assignedState({
        players: P,
        playerRoles: { alice: "tanner", bob: "werewolf", cara: "villager" },
        center: ["werewolf", "seer", "robber"],
      }).current,
      doppelgangerCopy: null,
      deaths: ["alice"],
    });
    expect(result.tanner).toBe(true);
    expect(result.werewolf).toBe(false);
    expect(result.village).toBe(false);
  });

  it("tanner and village both win if tanner and a werewolf die", () => {
    const result = resolveWins({
      players: P,
      current: assignedState({
        players: P,
        playerRoles: { alice: "tanner", bob: "werewolf", cara: "villager" },
        center: ["werewolf", "seer", "robber"],
      }).current,
      doppelgangerCopy: null,
      deaths: ["alice", "bob"],
    });
    expect(result.tanner).toBe(true);
    expect(result.village).toBe(true);
    expect(result.werewolf).toBe(false);
  });

  it("village loses if the tanner dies while all werewolves are in the center", () => {
    const result = resolveWins({
      players: P,
      current: assignedState({
        players: P,
        playerRoles: { alice: "tanner", bob: "villager", cara: "seer" },
        center: ["werewolf", "werewolf", "robber"],
      }).current,
      doppelgangerCopy: null,
      deaths: ["alice"],
    });
    expect(result.tanner).toBe(true);
    expect(result.village).toBe(false);
    expect(result.werewolf).toBe(false);
  });

  it("uses the doppelganger copy as the final role of the doppelganger card", () => {
    const result = resolveWins({
      players: P,
      current: assignedState({
        players: P,
        playerRoles: { alice: "doppelganger", bob: "villager", cara: "seer" },
        center: ["robber", "troublemaker", "drunk"],
      }).current,
      doppelgangerCopy: "werewolf",
      deaths: [],
    });
    expect(result.werewolf).toBe(true);
    expect(result.village).toBe(false);
  });
});

describe("every werewolf must die (house rule)", () => {
  const P4 = playersOf("Alice", "Bob", "Cara", "Drew");
  const twoWolves = assignedState({
    players: P4,
    playerRoles: {
      alice: "werewolf",
      bob: "werewolf",
      cara: "seer",
      drew: "tanner",
    },
    center: ["villager", "robber", "troublemaker"],
  }).current;

  it("werewolves still win if only one of two werewolves dies", () => {
    const result = resolveWins({
      players: P4,
      current: twoWolves,
      doppelgangerCopy: null,
      deaths: ["alice"],
    });
    expect(result).toMatchObject({ village: false, werewolf: true, tanner: false });
  });

  it("village wins when both werewolves die", () => {
    const result = resolveWins({
      players: P4,
      current: twoWolves,
      doppelgangerCopy: null,
      deaths: ["alice", "bob"],
    });
    expect(result).toMatchObject({ village: true, werewolf: false });
  });

  it("a Doppelgänger who copied a Werewolf must die too", () => {
    const current = assignedState({
      players: P4,
      playerRoles: {
        alice: "werewolf",
        bob: "doppelganger",
        cara: "seer",
        drew: "villager",
      },
      center: ["werewolf", "robber", "troublemaker"],
    }).current;
    const oneDead = resolveWins({
      players: P4,
      current,
      doppelgangerCopy: "werewolf",
      deaths: ["alice"],
    });
    expect(oneDead).toMatchObject({ village: false, werewolf: true });
    const bothDead = resolveWins({
      players: P4,
      current,
      doppelgangerCopy: "werewolf",
      deaths: ["alice", "bob"],
    });
    expect(bothDead).toMatchObject({ village: true, werewolf: false });
  });

  it("if the Tanner and one of two werewolves die, only the Tanner wins", () => {
    const result = resolveWins({
      players: P4,
      current: twoWolves,
      doppelgangerCopy: null,
      deaths: ["alice", "drew"],
    });
    expect(result).toMatchObject({ village: false, werewolf: false, tanner: true });
  });

  it("if the Tanner and both werewolves die, the Tanner and the village win", () => {
    const result = resolveWins({
      players: P4,
      current: twoWolves,
      doppelgangerCopy: null,
      deaths: ["alice", "bob", "drew"],
    });
    expect(result).toMatchObject({ village: true, werewolf: false, tanner: true });
  });
});
