import { describe, expect, it } from "vitest";
import { applyNightAction, beginNight, publicNightSteps } from "./night";
import { assignedState, playersOf } from "./test-helpers";

const P = playersOf("Alice", "Bob", "Cara", "Drew");

describe("public night progress", () => {
  it("lists the steps for the roles in the deck, in wake order", () => {
    expect(
      publicNightSteps([
        "villager",
        "insomniac",
        "werewolf",
        "seer",
        "troublemaker",
        "werewolf",
        "robber",
      ]),
    ).toEqual(["werewolves", "seer", "robber", "troublemaker", "insomniac"]);
  });

  it("always calls every Doppelgänger step its deck allows", () => {
    expect(
      publicNightSteps(["doppelganger", "werewolf", "minion", "insomniac", "villager"]),
    ).toEqual([
      "doppelganger_copy",
      "doppelganger_action",
      "doppelganger_minion",
      "werewolves",
      "minion",
      "insomniac",
      "doppelganger_insomniac",
    ]);
  });

  it("runs the Doppelgänger action step even when the copy has no action, so it reveals nothing", () => {
    const state = beginNight(
      assignedState({
        players: P,
        playerRoles: {
          alice: "doppelganger",
          bob: "villager",
          cara: "werewolf",
          drew: "seer",
        },
        center: ["werewolf", "robber", "troublemaker"],
      }),
    );
    expect(state.nightStep).toBe("doppelganger_copy");
    const copied = applyNightAction(state, "alice", {
      kind: "doppelganger_copy",
      targetPlayerId: "bob",
    });
    // Copied a Villager: the action step is still entered, just with no actor.
    expect(copied.doppelgangerCopy).toBe("villager");
    expect(copied.nightStep).toBe("doppelganger_action");
    expect(copied.pendingActorIds).toEqual([]);
  });
});
