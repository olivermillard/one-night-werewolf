import { describe, expect, it } from "vitest";
import { runScriptedNight } from "./night";
import { assignedState, playersOf } from "./test-helpers";
import type { NightAction, NightPrompt, NightStep, PlayerId } from "./types";
import { effectiveRole } from "./roles";

const P = playersOf("Alice", "Bob", "Cara", "Drew", "Eve");

function autoAck(prompt: NightPrompt): NightAction {
  if (prompt.kind === "acknowledge") return { kind: "acknowledge" };
  if (prompt.kind === "werewolf_lone") return { kind: "werewolf_lone_skip" };
  if (prompt.kind === "seer") return { kind: "seer_skip" };
  if (prompt.kind === "robber") return { kind: "robber_skip" };
  if (prompt.kind === "troublemaker") return { kind: "troublemaker_skip" };
  if (prompt.kind === "drunk") return { kind: "drunk", centerIndex: 0 };
  if (prompt.kind === "doppelganger_copy") {
    throw new Error("Test must choose a doppelganger target.");
  }
  throw new Error(`No auto action for ${prompt.kind}`);
}

function script(
  copyTarget: PlayerId,
  handlers: Partial<
    Record<
      NightStep,
      (ctx: { playerId: PlayerId; prompt: NightPrompt }) => NightAction
    >
  > = {},
) {
  return (ctx: {
    playerId: PlayerId;
    step: NightStep;
    prompt: NightPrompt;
  }): NightAction => {
    if (ctx.step === "doppelganger_copy") {
      return { kind: "doppelganger_copy", targetPlayerId: copyTarget };
    }
    return handlers[ctx.step]?.(ctx) ?? autoAck(ctx.prompt);
  };
}

describe("doppelganger copies", () => {
  it("becomes villager and does nothing else", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: {
        alice: "doppelganger",
        bob: "villager",
        cara: "werewolf",
      },
      center: ["werewolf", "seer", "hunter"],
    });
    const ended = runScriptedNight(state, script("bob"));
    expect(ended.doppelgangerCopy).toBe("villager");
    expect(
      ended.nightLog.filter((e) => e.actorIds.includes("alice")),
    ).toHaveLength(1);
  });

  it("becomes hunter and does nothing else at night", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "doppelganger", bob: "hunter", cara: "villager" },
      center: ["werewolf", "werewolf", "seer"],
    });
    const ended = runScriptedNight(state, script("bob"));
    expect(ended.doppelgangerCopy).toBe("hunter");
  });

  it("becomes tanner and does nothing else at night", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "doppelganger", bob: "tanner", cara: "villager" },
      center: ["werewolf", "werewolf", "seer"],
    });
    const ended = runScriptedNight(state, script("bob"));
    expect(ended.doppelgangerCopy).toBe("tanner");
  });

  it("wakes with werewolves after copying a werewolf", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "doppelganger",
        bob: "werewolf",
        cara: "villager",
        drew: "seer",
      },
      center: ["werewolf", "robber", "troublemaker"],
    });
    let wolfPrompt: NightPrompt | undefined;
    const ended = runScriptedNight(
      state,
      script("bob", {
        werewolves: ({ playerId, prompt }) => {
          if (playerId === "alice") wolfPrompt = prompt;
          return { kind: "acknowledge" };
        },
      }),
    );
    expect(ended.doppelgangerCopy).toBe("werewolf");
    expect(wolfPrompt?.seenPlayerIds).toContain("bob");
  });

  it("wakes with the copied werewolf even if the other werewolf is in the center", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: {
        alice: "doppelganger",
        bob: "werewolf",
        cara: "seer",
      },
      center: ["werewolf", "robber", "villager"],
    });
    let wolfActors = 0;
    const ended = runScriptedNight(
      state,
      script("bob", {
        werewolves: ({ prompt }) => {
          wolfActors += 1;
          expect(prompt.kind).toBe("acknowledge");
          return { kind: "acknowledge" };
        },
      }),
    );
    expect(wolfActors).toBe(2);
    expect(ended.doppelgangerCopy).toBe("werewolf");
  });

  it("wakes with masons after copying a mason", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "doppelganger",
        bob: "mason",
        cara: "mason",
        drew: "villager",
      },
      center: ["werewolf", "werewolf", "seer"],
    });
    let masonPrompt: NightPrompt | undefined;
    runScriptedNight(
      state,
      script("bob", {
        masons: ({ playerId, prompt }) => {
          if (playerId === "alice") masonPrompt = prompt;
          return { kind: "acknowledge" };
        },
      }),
    );
    expect(masonPrompt?.seenPlayerIds.sort()).toEqual(["bob", "cara"]);
  });

  it("does seer immediately and the original seer still acts later", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "doppelganger",
        bob: "seer",
        cara: "werewolf",
        drew: "villager",
      },
      center: ["werewolf", "robber", "troublemaker"],
    });
    const ended = runScriptedNight(
      state,
      script("bob", {
        doppelganger_action: () => ({
          kind: "seer_player",
          targetPlayerId: "cara",
        }),
        seer: () => ({ kind: "seer_player", targetPlayerId: "drew" }),
      }),
    );
    expect(
      ended.nightLog.filter((e) => e.summary.includes("Doppelgänger-Seer")),
    ).toHaveLength(1);
    expect(
      ended.nightLog.filter((e) => e.summary.includes("(Seer) looked")),
    ).toHaveLength(1);
  });

  it("does robber immediately", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: {
        alice: "doppelganger",
        bob: "robber",
        cara: "werewolf",
      },
      center: ["villager", "seer", "troublemaker"],
    });
    const ended = runScriptedNight(
      state,
      script("bob", {
        doppelganger_action: () => ({ kind: "robber", targetPlayerId: "cara" }),
      }),
    );
    expect(ended.current.players.alice).toBe("werewolf");
    expect(ended.current.players.cara).toBe("doppelganger");
    expect(effectiveRole(ended.current.players.cara!, ended.doppelgangerCopy)).toBe(
      "robber",
    );
  });

  it("does troublemaker immediately", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "doppelganger",
        bob: "troublemaker",
        cara: "werewolf",
        drew: "villager",
      },
      center: ["seer", "robber", "insomniac"],
    });
    const ended = runScriptedNight(
      state,
      script("bob", {
        doppelganger_action: () => ({
          kind: "troublemaker",
          playerAId: "cara",
          playerBId: "drew",
        }),
      }),
    );
    expect(ended.current.players.cara).toBe("villager");
    expect(ended.current.players.drew).toBe("werewolf");
  });

  it("does drunk immediately", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: {
        alice: "doppelganger",
        bob: "drunk",
        cara: "villager",
      },
      center: ["werewolf", "seer", "hunter"],
    });
    const ended = runScriptedNight(
      state,
      script("bob", {
        doppelganger_action: () => ({ kind: "drunk", centerIndex: 0 }),
        drunk: () => ({ kind: "drunk", centerIndex: 1 }),
      }),
    );
    expect(ended.current.players.alice).toBe("werewolf");
    expect(ended.current.center[0]).toBe("doppelganger");
    expect(ended.current.players.bob).toBe("seer");
    expect(ended.current.center[1]).toBe("drunk");
  });

  it("as minion sees werewolves during the doppelganger phase", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "doppelganger",
        bob: "minion",
        cara: "werewolf",
        drew: "villager",
      },
      center: ["werewolf", "seer", "robber"],
    });
    let prompt: NightPrompt | undefined;
    const ended = runScriptedNight(
      state,
      script("bob", {
        doppelganger_minion: ({ prompt: p }) => {
          prompt = p;
          return { kind: "acknowledge" };
        },
      }),
    );
    expect(prompt?.seenPlayerIds).toEqual(["cara"]);
    expect(ended.nightLog.some((e) => e.summary.includes("Doppelgänger-Minion"))).toBe(
      true,
    );
  });

  it("as insomniac looks at their card after the insomniac", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "doppelganger",
        bob: "insomniac",
        cara: "robber",
        drew: "villager",
      },
      center: ["werewolf", "werewolf", "seer"],
    });
    const ended = runScriptedNight(
      state,
      script("bob", {
        robber: () => ({ kind: "robber", targetPlayerId: "alice" }),
        doppelganger_insomniac: ({ prompt }) => {
          expect(prompt.ownRole).toBe("robber");
          return { kind: "acknowledge" };
        },
      }),
    );
    expect(ended.current.players.alice).toBe("robber");
    expect(
      ended.nightLog.some((e) => e.summary.includes("Doppelgänger-Insomniac")),
    ).toBe(true);
  });

  it("a player who receives the doppelganger card is the copied role", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: {
        alice: "doppelganger",
        bob: "seer",
        cara: "robber",
      },
      center: ["villager", "werewolf", "werewolf"],
    });
    const ended = runScriptedNight(
      state,
      script("bob", {
        doppelganger_action: () => ({ kind: "seer_skip" }),
        robber: () => ({ kind: "robber", targetPlayerId: "alice" }),
      }),
    );
    expect(ended.current.players.cara).toBe("doppelganger");
    expect(ended.doppelgangerCopy).toBe("seer");
    expect(
      effectiveRole(ended.current.players.cara!, ended.doppelgangerCopy),
    ).toBe("seer");
  });
});
