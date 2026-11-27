import { describe, expect, it } from "vitest";
import {
  applyNightAction,
  beginNight,
  getPrompt,
  runScriptedNight,
  skipEmptyStepsForTests,
} from "./night";
import { assignedState, playersOf } from "./test-helpers";
import type { NightAction, NightPrompt, NightStep, PlayerId } from "./types";

const P = playersOf("Alice", "Bob", "Cara", "Drew", "Eve");

function autoAck(prompt: NightPrompt): NightAction {
  if (prompt.kind === "acknowledge") return { kind: "acknowledge" };
  if (prompt.kind === "werewolf_lone") return { kind: "werewolf_lone_skip" };
  if (prompt.kind === "seer") return { kind: "seer_skip" };
  if (prompt.kind === "robber") return { kind: "robber_skip" };
  if (prompt.kind === "troublemaker") return { kind: "troublemaker_skip" };
  if (prompt.kind === "drunk") return { kind: "drunk", centerIndex: 0 };
  if (prompt.kind === "doppelganger_copy") {
    const target = prompt.playerIds[0];
    if (!target) throw new Error("No doppelganger target.");
    return { kind: "doppelganger_copy", targetPlayerId: target };
  }
  throw new Error(`No auto action for ${prompt.kind}`);
}

function script(
  handlers: Partial<
    Record<
      NightStep,
      (ctx: { playerId: PlayerId; prompt: NightPrompt }) => NightAction
    >
  >,
) {
  return (ctx: {
    playerId: PlayerId;
    step: NightStep;
    prompt: NightPrompt;
  }) => handlers[ctx.step]?.(ctx) ?? autoAck(ctx.prompt);
}

describe("werewolves", () => {
  it("lets two werewolves see each other", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "werewolf", bob: "werewolf", cara: "villager" },
      center: ["seer", "robber", "troublemaker"],
    });
    const ended = runScriptedNight(state, script({}));
    expect(ended.nightLog.some((e) => e.summary.includes("Alice") && e.summary.includes("Bob"))).toBe(
      true,
    );
  });

  it("lets a lone werewolf look at one center card", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "werewolf", bob: "seer", cara: "villager" },
      center: ["werewolf", "robber", "troublemaker"],
    });
    const ended = runScriptedNight(
      state,
      script({
        werewolves: () => ({ kind: "werewolf_lone", centerIndex: 1 }),
      }),
    );
    expect(ended.current).toEqual(ended.original);
    expect(ended.nightLog.some((e) => e.summary.includes("Robber"))).toBe(true);
  });
});

describe("minion", () => {
  it("sees werewolves and werewolves do not learn the minion", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "werewolf",
        bob: "werewolf",
        cara: "minion",
        drew: "villager",
      },
      center: ["seer", "robber", "troublemaker"],
    });
    const seen: string[][] = [];
    const ended = runScriptedNight(
      state,
      script({
        minion: ({ prompt }) => {
          seen.push(prompt.seenPlayerIds);
          return { kind: "acknowledge" };
        },
      }),
    );
    expect(seen[0]?.slice().sort()).toEqual(["alice", "bob"]);
    expect(
      ended.nightLog.find((e) => e.summary.includes("Minion"))?.summary,
    ).toContain("Alice");
  });
});

describe("masons", () => {
  it("lets masons see each other", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "mason", bob: "mason", cara: "villager" },
      center: ["werewolf", "werewolf", "seer"],
    });
    const ended = runScriptedNight(state, script({}));
    expect(ended.nightLog.some((e) => e.summary.includes("Masons saw each other"))).toBe(
      true,
    );
  });

  it("tells a lone mason the other is in the center", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "mason", bob: "villager", cara: "seer" },
      center: ["mason", "werewolf", "werewolf"],
    });
    const ended = runScriptedNight(state, script({}));
    expect(ended.nightLog.some((e) => e.summary.includes("saw no other Mason"))).toBe(
      true,
    );
  });
});

describe("seer", () => {
  it("can look at one other player", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "seer", bob: "werewolf", cara: "villager" },
      center: ["werewolf", "robber", "troublemaker"],
    });
    const ended = runScriptedNight(
      state,
      script({
        seer: () => ({ kind: "seer_player", targetPlayerId: "bob" }),
      }),
    );
    expect(ended.nightLog.some((e) => e.summary.includes("Bob’s card: Werewolf"))).toBe(
      true,
    );
  });

  it("can look at two center cards", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "seer", bob: "villager", cara: "robber" },
      center: ["werewolf", "troublemaker", "drunk"],
    });
    const ended = runScriptedNight(
      state,
      script({
        seer: () => ({ kind: "seer_center", centerIndexes: [0, 2] }),
      }),
    );
    expect(ended.nightLog.some((e) => e.summary.includes("Werewolf") && e.summary.includes("Drunk"))).toBe(
      true,
    );
  });
});

describe("robber", () => {
  it("swaps and sees the new card", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "robber", bob: "werewolf", cara: "villager" },
      center: ["werewolf", "seer", "troublemaker"],
    });
    const ended = runScriptedNight(
      state,
      script({
        robber: () => ({ kind: "robber", targetPlayerId: "bob" }),
      }),
    );
    expect(ended.current.players.alice).toBe("werewolf");
    expect(ended.current.players.bob).toBe("robber");
    expect(ended.original.players.alice).toBe("robber");
  });

  it("may skip", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "robber", bob: "werewolf", cara: "villager" },
      center: ["werewolf", "seer", "troublemaker"],
    });
    const ended = runScriptedNight(
      state,
      script({
        robber: () => ({ kind: "robber_skip" }),
      }),
    );
    expect(ended.current.players.alice).toBe("robber");
  });
});

describe("troublemaker", () => {
  it("swaps two other players without looking", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "troublemaker",
        bob: "werewolf",
        cara: "seer",
        drew: "villager",
      },
      center: ["werewolf", "robber", "insomniac"],
    });
    const ended = runScriptedNight(
      state,
      script({
        troublemaker: () => ({
          kind: "troublemaker",
          playerAId: "bob",
          playerBId: "cara",
        }),
      }),
    );
    expect(ended.current.players.bob).toBe("seer");
    expect(ended.current.players.cara).toBe("werewolf");
    expect(ended.current.players.alice).toBe("troublemaker");
  });
});

describe("drunk", () => {
  it("must swap with a center card and does not see it", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "drunk", bob: "villager", cara: "seer" },
      center: ["werewolf", "robber", "troublemaker"],
    });
    const ended = runScriptedNight(
      state,
      script({
        drunk: () => ({ kind: "drunk", centerIndex: 0 }),
      }),
    );
    expect(ended.current.players.alice).toBe("werewolf");
    expect(ended.current.center[0]).toBe("drunk");
  });
});

describe("insomniac", () => {
  it("sees their card after robber and troublemaker", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "insomniac",
        bob: "robber",
        cara: "troublemaker",
        drew: "villager",
      },
      center: ["werewolf", "werewolf", "seer"],
    });
    const ended = runScriptedNight(
      state,
      script({
        robber: () => ({ kind: "robber", targetPlayerId: "alice" }),
        troublemaker: () => ({ kind: "troublemaker_skip" }),
        insomniac: ({ prompt }) => {
          expect(prompt.ownRole).toBe("robber");
          return { kind: "acknowledge" };
        },
      }),
    );
    expect(ended.current.players.alice).toBe("robber");
    expect(ended.current.players.bob).toBe("insomniac");
  });
});

describe("empty center roles", () => {
  it("skips a seer who is only in the center during tests", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "villager", bob: "villager", cara: "werewolf" },
      center: ["seer", "werewolf", "robber"],
    });
    const ended = runScriptedNight(state, script({}));
    expect(ended.nightStep).toBe("complete");
    expect(ended.nightLog.some((e) => e.summary.includes("Seer"))).toBe(false);
  });
});

describe("prompts are private", () => {
  it("only the acting player receives a prompt", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "seer", bob: "villager", cara: "werewolf" },
      center: ["werewolf", "robber", "troublemaker"],
    });
    let night = skipEmptyStepsForTests(beginNight(state));
    while (night.nightStep !== "seer") {
      const actor = night.pendingActorIds[0];
      if (!actor) {
        night = skipEmptyStepsForTests(night);
        if (!night.pendingActorIds[0]) break;
        continue;
      }
      const prompt = getPrompt(night, actor);
      if (!prompt) break;
      night = applyNightAction(night, actor, autoAck(prompt));
      night = skipEmptyStepsForTests(night);
    }
    expect(getPrompt(night, "alice")?.kind).toBe("seer");
    expect(getPrompt(night, "bob")).toBeNull();
    expect(getPrompt(night, "cara")).toBeNull();
  });
});
