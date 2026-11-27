import { describe, expect, it } from "vitest";
import { runScriptedNight } from "./night";
import { assignedState, playersOf } from "./test-helpers";
import { resolveVotes } from "./vote";
import { roleAtEnd } from "./win";
import type { NightAction, NightPrompt, NightStep, PlayerId } from "./types";

const P = playersOf("Alice", "Bob", "Cara", "Drew", "Eve");

type Handler = (ctx: { playerId: PlayerId; prompt: NightPrompt }) => NightAction;

function script(handlers: Partial<Record<NightStep, Handler>>) {
  return (ctx: { playerId: PlayerId; step: NightStep; prompt: NightPrompt }) => {
    const handler = handlers[ctx.step];
    if (handler) return handler(ctx);
    if (ctx.prompt.kind === "acknowledge") return { kind: "acknowledge" } as const;
    if (ctx.prompt.kind === "werewolf_lone") return { kind: "werewolf_lone_skip" } as const;
    throw new Error(`Unscripted prompt ${ctx.prompt.kind} at ${ctx.step}`);
  };
}

describe("robber and troublemaker swaps", () => {
  it("robber takes a werewolf card and becomes a werewolf; the victim becomes the robber", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "robber", bob: "werewolf", cara: "villager" },
      center: ["seer", "troublemaker", "villager"],
    });
    const ended = runScriptedNight(
      state,
      script({ robber: () => ({ kind: "robber", targetPlayerId: "bob" }) }),
    );
    expect(ended.current.players).toEqual({
      alice: "werewolf",
      bob: "robber",
      cara: "villager",
    });
    expect(ended.flashes.alice?.roles).toEqual(["werewolf"]);
    // Voting out the (new) werewolf Alice wins it for the village.
    const result = resolveVotes({
      players: ended.players,
      current: ended.current,
      doppelgangerCopy: null,
      votes: { bob: ["alice"], cara: ["alice"], alice: ["bob"] },
    });
    expect(result.deaths).toEqual(["alice"]);
    expect(result.winners.village).toBe(true);
  });

  it("troublemaker acts after robber, so it can move the robber's stolen card", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "robber",
        bob: "werewolf",
        cara: "troublemaker",
        drew: "villager",
      },
      center: ["seer", "villager", "villager"],
    });
    const ended = runScriptedNight(
      state,
      script({
        robber: () => ({ kind: "robber", targetPlayerId: "bob" }),
        troublemaker: () => ({
          kind: "troublemaker",
          playerAId: "alice",
          playerBId: "drew",
        }),
      }),
    );
    // Robber: alice=werewolf, bob=robber. Troublemaker: alice<->drew.
    expect(ended.current.players).toEqual({
      alice: "villager",
      bob: "robber",
      cara: "troublemaker",
      drew: "werewolf",
    });
    // The Robber was told werewolf at the time; the later swap is not shown.
    expect(ended.flashes.alice?.roles).toEqual(["werewolf"]);
    expect(roleAtEnd(ended.current, "drew", null)).toBe("werewolf");
  });

  it("troublemaker can swap the robber's victim and another player", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "robber",
        bob: "seer",
        cara: "troublemaker",
        drew: "werewolf",
      },
      center: ["villager", "villager", "tanner"],
    });
    const ended = runScriptedNight(
      state,
      script({
        seer: () => ({ kind: "seer_skip" }),
        robber: () => ({ kind: "robber", targetPlayerId: "bob" }),
        troublemaker: () => ({
          kind: "troublemaker",
          playerAId: "bob",
          playerBId: "drew",
        }),
      }),
    );
    expect(ended.current.players).toEqual({
      alice: "seer",
      bob: "werewolf",
      cara: "troublemaker",
      drew: "robber",
    });
  });

  it("swapping is not allowed with yourself", () => {
    const state = assignedState({
      players: P.slice(0, 3),
      playerRoles: { alice: "robber", bob: "troublemaker", cara: "werewolf" },
      center: ["villager", "villager", "seer"],
    });
    expect(() =>
      runScriptedNight(
        state,
        script({ robber: () => ({ kind: "robber", targetPlayerId: "alice" }) }),
      ),
    ).toThrow(/rob themselves/);
    expect(() =>
      runScriptedNight(
        state,
        script({
          robber: () => ({ kind: "robber_skip" }),
          troublemaker: () => ({
            kind: "troublemaker",
            playerAId: "bob",
            playerBId: "cara",
          }),
        }),
      ),
    ).toThrow(/own card/);
  });

  it("doppelganger-robber swaps immediately; whoever gets the doppelganger card is a robber", () => {
    const state = assignedState({
      players: P.slice(0, 4),
      playerRoles: {
        alice: "doppelganger",
        bob: "robber",
        cara: "werewolf",
        drew: "villager",
      },
      center: ["villager", "seer", "troublemaker"],
    });
    const ended = runScriptedNight(
      state,
      script({
        doppelganger_copy: () => ({ kind: "doppelganger_copy", targetPlayerId: "bob" }),
        doppelganger_action: () => ({ kind: "robber", targetPlayerId: "cara" }),
        robber: () => ({ kind: "robber", targetPlayerId: "alice" }),
      }),
    );
    // DG-robber: alice<->cara => alice=werewolf, cara=doppelganger.
    // Robber (bob) then robs alice => bob=werewolf, alice=robber.
    expect(ended.current.players).toEqual({
      alice: "robber",
      bob: "werewolf",
      cara: "doppelganger",
      drew: "villager",
    });
    expect(roleAtEnd(ended.current, "cara", ended.doppelgangerCopy)).toBe("robber");
  });
});
