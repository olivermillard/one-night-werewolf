import { describe, expect, it } from "vitest";
import { validateDeck, hardValidateDeck, MAD_SEER_WARNING } from "./deck";
import {
  applyNightAction,
  beginNight,
  getPrompt,
  madVisions,
  publicNightSteps,
  runScriptedNight,
  skipEmptyStepsForTests,
} from "./night";
import { disguise } from "./roles";
import { assignedState, playersOf } from "./test-helpers";
import type { GameState, NightAction, NightPrompt, NightStep, PlayerId } from "./types";
import { resolveVotes } from "./vote";
import { poacherWins } from "./win";

const P = playersOf("Alice", "Bob", "Cara", "Drew", "Eve");

type Handler = (ctx: { playerId: PlayerId; prompt: NightPrompt }) => NightAction;

function script(handlers: Partial<Record<NightStep, Handler>>) {
  return (ctx: { playerId: PlayerId; step: NightStep; prompt: NightPrompt }) => {
    const handler = handlers[ctx.step];
    if (handler) return handler(ctx);
    if (ctx.prompt.kind === "acknowledge") return { kind: "acknowledge" } as const;
    if (ctx.prompt.kind === "werewolf_lone") return { kind: "werewolf_lone_skip" } as const;
    if (ctx.prompt.kind === "seer") return { kind: "seer_skip" } as const;
    if (ctx.prompt.kind === "troublemaker") return { kind: "troublemaker_skip" } as const;
    if (ctx.prompt.kind === "robber") return { kind: "robber_skip" } as const;
    if (ctx.prompt.kind === "herbalist") return { kind: "herbalist_skip" } as const;
    if (ctx.prompt.kind === "messenger") return { kind: "messenger_skip" } as const;
    throw new Error(`Unscripted prompt ${ctx.prompt.kind} at ${ctx.step}`);
  };
}

/** Walk the night until it reaches `step`, acting as the script says. */
function nightUntil(state: GameState, step: NightStep): GameState {
  let current = skipEmptyStepsForTests(beginNight(state));
  const auto = script({});
  let guard = 0;
  while (current.nightStep !== step && current.nightStep !== "complete") {
    if (++guard > 100) throw new Error("stuck");
    const actor = current.pendingActorIds.find((id) => !current.acknowledgedIds.includes(id))!;
    const prompt = getPrompt(current, actor)!;
    current = skipEmptyStepsForTests(
      applyNightAction(current, actor, auto({ playerId: actor, step: current.nightStep, prompt })),
    );
  }
  return current;
}

describe("night order with the custom cards", () => {
  it("calls the new cards where planned", () => {
    expect(
      publicNightSteps([
        "doppelganger",
        "werewolf",
        "minion",
        "mason",
        "mason",
        "poacher",
        "seer",
        "mad_seer",
        "robber",
        "troublemaker",
        "herbalist",
        "drunk",
        "messenger",
        "insomniac",
      ]),
    ).toEqual([
      "doppelganger_copy",
      "doppelganger_action",
      "doppelganger_minion",
      "werewolves",
      "minion",
      "masons",
      "poacher",
      "seer",
      "robber",
      "troublemaker",
      "herbalist",
      "drunk",
      "messenger",
      "insomniac",
      "doppelganger_insomniac",
    ]);
  });

  it("the Mad Seer has no call of its own: it wakes in the Seer's step", () => {
    expect(publicNightSteps(["mad_seer", "villager"])).toEqual(["seer"]);
  });
});

describe("Mad Seer", () => {
  const state = () =>
    assignedState({
      players: P.slice(0, 4),
      playerRoles: { alice: "mad_seer", bob: "werewolf", cara: "seer", drew: "villager" },
      center: ["robber", "troublemaker", "villager"],
    });

  it("wakes with the Seer and gets the same prompt", () => {
    const night = nightUntil(state(), "seer");
    expect(night.pendingActorIds.sort()).toEqual(["alice", "cara"]);
    // Identical apart from who they may look at (everyone but themselves).
    const strip = (prompt: NightPrompt | null) => ({ ...prompt, playerIds: [] });
    expect(strip(getPrompt(night, "alice"))).toEqual(strip(getPrompt(night, "cara")));
    expect(getPrompt(night, "alice")?.ownRole).toBe("seer");
  });

  it("is always shown a wrong role, taken from the deck", () => {
    for (let trial = 0; trial < 200; trial += 1) {
      const night = nightUntil(state(), "seer");
      const after = applyNightAction(night, "alice", { kind: "seer_player", targetPlayerId: "bob" });
      const shown = after.flashes.alice!.roles[0]!;
      expect(shown).not.toBe("werewolf");
      expect(night.deck.map(disguise)).toContain(shown);
      expect(after.nightLog.at(-1)!.summary).toMatch(/really the Werewolf/);
    }
  });

  it("gets both center cards wrong, without showing a card more often than the deck has it", () => {
    for (let trial = 0; trial < 200; trial += 1) {
      const night = nightUntil(state(), "seer");
      const after = applyNightAction(night, "alice", {
        kind: "seer_center",
        centerIndexes: [0, 1],
      });
      const [a, b] = after.flashes.alice!.roles;
      expect(a).not.toBe("robber");
      expect(b).not.toBe("troublemaker");
      if (a === b) expect(a).toBe("villager");
    }
  });

  it("looks like a Seer to everyone else: the real Seer, the Robber and the Insomniac", () => {
    expect(disguise("mad_seer")).toBe("seer");
    const seen = runScriptedNight(
      assignedState({
        players: P.slice(0, 4),
        playerRoles: { alice: "mad_seer", bob: "seer", cara: "robber", drew: "insomniac" },
        center: ["werewolf", "werewolf", "villager"],
      }),
      script({
        seer: ({ playerId }) =>
          playerId === "bob"
            ? { kind: "seer_player", targetPlayerId: "alice" }
            : { kind: "seer_skip" },
        robber: () => ({ kind: "robber", targetPlayerId: "alice" }),
      }),
    );
    expect(seen.flashes.bob?.roles).toEqual(["seer"]);
    expect(seen.flashes.cara?.roles).toEqual(["seer"]);
    expect(seen.current.players.cara).toBe("mad_seer");
  });

  it("a Doppelgänger who copies the Mad Seer thinks it's a Seer and sees lies", () => {
    const night = nightUntil(
      assignedState({
        players: P.slice(0, 4),
        playerRoles: { alice: "doppelganger", bob: "mad_seer", cara: "werewolf", drew: "seer" },
        center: ["villager", "villager", "robber"],
      }),
      "doppelganger_copy",
    );
    const copied = applyNightAction(night, "alice", {
      kind: "doppelganger_copy",
      targetPlayerId: "bob",
    });
    expect(copied.flashes.alice?.roles).toEqual(["seer"]);
    expect(copied.doppelgangerCopy).toBe("mad_seer");
    expect(copied.nightStep).toBe("doppelganger_action");
    expect(getPrompt(copied, "alice")?.kind).toBe("seer");
    const looked = applyNightAction(copied, "alice", {
      kind: "seer_player",
      targetPlayerId: "cara",
    });
    expect(looked.flashes.alice?.roles[0]).not.toBe("werewolf");
  });

  it("madVisions never repeats the viewer's own apparent card beyond the deck", () => {
    const base = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "mad_seer", bob: "werewolf", cara: "villager" },
      center: ["villager", "werewolf", "robber"],
    });
    // Deck shows one "Seer" (the Mad Seer's own card), so a lie is never "Seer".
    for (let i = 0; i < 100; i += 1) {
      expect(madVisions(base, "alice", ["werewolf"], Math.random)).not.toContain("seer");
    }
  });

  it("is a soft warning without a real Seer, never blocking the deal", () => {
    const deck = ["mad_seer", "werewolf", "werewolf", "villager", "villager", "robber"] as const;
    expect(validateDeck([...deck], 3)).toContain(MAD_SEER_WARNING);
    expect(hardValidateDeck([...deck], 3)).toEqual([]);
  });
});

describe("Poacher", () => {
  it("is shown a random other player as their mark at nightfall", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: { alice: "poacher", bob: "werewolf", cara: "seer", drew: "villager" },
      center: ["villager", "robber", "troublemaker"],
    });
    const marks = new Set<string>();
    for (let i = 0; i < 100; i += 1) {
      const night = nightUntil(state, "poacher");
      const mark = night.marks?.poacher;
      expect(mark).toBeDefined();
      expect(mark).not.toBe("alice");
      expect(getPrompt(night, "alice")?.seenPlayerIds).toEqual([mark]);
      marks.add(mark!);
    }
    expect(marks.size).toBe(3);
  });

  it("wins alongside the village when the mark dies", () => {
    const state: GameState = {
      ...assignedState({
        players: P.slice(0, 4),
        playerRoles: { alice: "poacher", bob: "werewolf", cara: "seer", drew: "villager" },
        center: ["villager", "robber", "troublemaker"],
      }),
      marks: { poacher: "bob" },
    };
    const ended = runScriptedNight(state, script({}));
    const result = resolveVotes({
      players: ended.players,
      current: ended.current,
      doppelgangerCopy: null,
      votes: { alice: ["bob"], cara: ["bob"], drew: [], bob: [] },
      marks: ended.marks,
    });
    expect(result.deaths).toEqual(["bob"]);
    expect(result.winners.village).toBe(true);
    expect(result.winners.poacher).toBe(true);
  });

  it("doesn't win when the mark lives", () => {
    const result = resolveVotes({
      players: P.slice(0, 3),
      current: {
        players: { alice: "poacher", bob: "werewolf", cara: "villager" },
        center: ["villager", "seer", "robber"],
      },
      doppelgangerCopy: null,
      votes: { alice: ["bob"], bob: ["alice"], cara: ["bob"] },
      marks: { poacher: "cara" },
    });
    expect(result.winners.poacher).toBe(false);
  });

  it("the mark goes with the card: a Robber who takes it inherits the bounty", () => {
    const current = {
      players: { alice: "robber" as const, bob: "werewolf" as const, cara: "poacher" as const },
      center: ["villager", "seer", "villager"] as ["villager", "seer", "villager"],
    };
    // Alice started as the Poacher and was robbed by Cara.
    expect(
      poacherWins({
        players: P.slice(0, 3),
        current,
        doppelgangerCopy: null,
        deaths: ["bob"],
        marks: { poacher: "bob" },
      }),
    ).toEqual(["cara"]);
  });

  it("a Doppelgänger who copies the Poacher gets a mark of their own", () => {
    const night = nightUntil(
      assignedState({
        players: P.slice(0, 4),
        playerRoles: { alice: "doppelganger", bob: "poacher", cara: "werewolf", drew: "villager" },
        center: ["villager", "seer", "robber"],
      }),
      "doppelganger_copy",
    );
    const copied = applyNightAction(night, "alice", {
      kind: "doppelganger_copy",
      targetPlayerId: "bob",
    });
    const mark = copied.marks?.doppelganger;
    expect(mark).toBeDefined();
    expect(mark).not.toBe("alice");
    expect(copied.nightStep).toBe("doppelganger_action");
    expect(getPrompt(copied, "alice")?.seenPlayerIds).toEqual([mark]);
    expect(
      poacherWins({
        players: copied.players,
        current: copied.current,
        doppelgangerCopy: "poacher",
        deaths: [mark!],
        marks: copied.marks!,
      }),
    ).toContain("alice");
  });
});

describe("Herbalist", () => {
  const state = () =>
    assignedState({
      players: P.slice(0, 4),
      playerRoles: { alice: "herbalist", bob: "werewolf", cara: "troublemaker", drew: "insomniac" },
      center: ["villager", "seer", "robber"],
    });

  it("swaps another player's card with the center, after the Troublemaker and before the Insomniac", () => {
    const ended = runScriptedNight(
      state(),
      script({
        troublemaker: () => ({ kind: "troublemaker", playerAId: "bob", playerBId: "drew" }),
        herbalist: () => ({ kind: "herbalist", targetPlayerId: "bob", centerIndex: 0 }),
      }),
    );
    // Troublemaker: bob=insomniac, drew=werewolf. Herbalist: bob gets the villager.
    expect(ended.current.players).toEqual({
      alice: "herbalist",
      bob: "villager",
      cara: "troublemaker",
      drew: "werewolf",
    });
    expect(ended.current.center[0]).toBe("insomniac");
    // The Herbalist sees nothing; Drew (Insomniac) sees the Werewolf they got.
    expect(ended.flashes.alice).toBeUndefined();
    expect(ended.flashes.drew?.roles).toEqual(["werewolf"]);
  });

  it("can't swap their own card", () => {
    const night = nightUntil(state(), "herbalist");
    expect(() =>
      applyNightAction(night, "alice", { kind: "herbalist", targetPlayerId: "alice", centerIndex: 1 }),
    ).toThrow();
  });

  it("can skip", () => {
    const ended = runScriptedNight(state(), script({}));
    expect(ended.current.players.bob).toBe("werewolf");
  });
});

describe("Messenger", () => {
  const state = () =>
    assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "messenger", bob: "werewolf", cara: "villager" },
      center: ["villager", "seer", "robber"],
    });

  it("sends one tidied note to another player", () => {
    const ended = runScriptedNight(
      state(),
      script({
        messenger: () => ({
          kind: "messenger",
          targetPlayerId: "cara",
          text: "  Bob   is\nlying  ",
        }),
      }),
    );
    expect(ended.messages).toEqual([{ from: "alice", to: "cara", text: "Bob is lying" }]);
  });

  it("rejects empty, too-long and self-addressed notes", () => {
    const night = nightUntil(state(), "messenger");
    expect(() =>
      applyNightAction(night, "alice", { kind: "messenger", targetPlayerId: "cara", text: "   " }),
    ).toThrow();
    expect(() =>
      applyNightAction(night, "alice", {
        kind: "messenger",
        targetPlayerId: "cara",
        text: "x".repeat(81),
      }),
    ).toThrow();
    expect(() =>
      applyNightAction(night, "alice", { kind: "messenger", targetPlayerId: "alice", text: "hi" }),
    ).toThrow();
  });

  it("acts after the Drunk and before the Insomniac", () => {
    const steps = publicNightSteps(["drunk", "messenger", "insomniac"]);
    expect(steps).toEqual(["drunk", "messenger", "insomniac"]);
  });
});
