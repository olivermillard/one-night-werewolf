import type { Rng } from "./deal";
import { disguise, displayName, isImmediateCopyRole } from "./roles";
import {
  playerName,
  swapPlayerWithCenter,
  swapPlayers,
} from "./positions";
import {
  MESSAGE_MAX_LENGTH,
  NIGHT_STEPS,
  ROLES,
  assertNever,
  type FlashReveal,
  type GameState,
  type NightAction,
  type NightLogEntry,
  type NightPrompt,
  type NightStep,
  type PlayerId,
  type Role,
} from "./types";

export const CENTER_LABELS = ["Left", "Middle", "Right"] as const;

export function originalHolders(state: GameState, role: Role): PlayerId[] {
  return state.players
    .filter((player) => state.original.players[player.id] === role)
    .map((player) => player.id);
}

export function doppelgangerId(state: GameState): PlayerId | null {
  return originalHolders(state, "doppelganger")[0] ?? null;
}

export function isStepInGame(state: GameState, step: NightStep): boolean {
  const has = (role: Role) => state.deck.includes(role);
  switch (step) {
    case "doppelganger_copy":
      return has("doppelganger");
    case "doppelganger_action":
      // Always called when the Doppelgänger is in the deck (as the narrator
      // does), so skipping it can't reveal which role was copied.
      return has("doppelganger");
    case "doppelganger_minion":
      return has("doppelganger") && has("minion");
    case "werewolves":
      return has("werewolf");
    case "minion":
      return has("minion");
    case "masons":
      return has("mason");
    case "poacher":
      return has("poacher");
    case "seer":
      // The Mad Seer wakes with the Seer, so it never has a call of its own.
      return has("seer") || has("mad_seer");
    case "robber":
      return has("robber");
    case "troublemaker":
      return has("troublemaker");
    case "herbalist":
      return has("herbalist");
    case "drunk":
      return has("drunk");
    case "messenger":
      return has("messenger");
    case "insomniac":
      return has("insomniac");
    case "doppelganger_insomniac":
      return has("doppelganger") && has("insomniac");
    case "complete":
      return true;
    default:
      return assertNever(step);
  }
}

export function actorsFor(state: GameState, step: NightStep): PlayerId[] {
  const dg = doppelgangerId(state);
  const copy = state.doppelgangerCopy;
  switch (step) {
    case "doppelganger_copy":
      return dg ? [dg] : [];
    case "doppelganger_action":
      return dg && copy && isImmediateCopyRole(copy) ? [dg] : [];
    case "doppelganger_minion":
      return dg && copy === "minion" ? [dg] : [];
    case "werewolves": {
      const ids = originalHolders(state, "werewolf");
      if (dg && copy === "werewolf") ids.push(dg);
      return unique(ids);
    }
    case "minion":
      return originalHolders(state, "minion");
    case "masons": {
      const ids = originalHolders(state, "mason");
      if (dg && copy === "mason") ids.push(dg);
      return unique(ids);
    }
    case "poacher":
      return originalHolders(state, "poacher");
    case "seer":
      return [
        ...originalHolders(state, "seer"),
        ...originalHolders(state, "mad_seer"),
      ];
    case "robber":
      return originalHolders(state, "robber");
    case "troublemaker":
      return originalHolders(state, "troublemaker");
    case "herbalist":
      return originalHolders(state, "herbalist");
    case "drunk":
      return originalHolders(state, "drunk");
    case "messenger":
      return originalHolders(state, "messenger");
    case "insomniac":
      return originalHolders(state, "insomniac");
    case "doppelganger_insomniac":
      return dg && copy === "insomniac" ? [dg] : [];
    case "complete":
      return [];
    default:
      return assertNever(step);
  }
}

/**
 * The night steps the narrator calls for this deck, in order. Depends only on
 * which cards are in play (public), never on who holds them or the
 * Doppelgänger's copy, so it is safe to show everyone.
 */
export type CalledNightStep = Exclude<NightStep, "complete">;

export function publicNightSteps(deck: Role[]): CalledNightStep[] {
  const probe = { deck, doppelgangerCopy: null } as unknown as GameState;
  return NIGHT_STEPS.filter(
    (step): step is CalledNightStep =>
      step !== "complete" && isStepInGame(probe, step),
  );
}

export const NIGHT_STEP_INFO: Record<
  CalledNightStep,
  { label: string; role: Role }
> = {
  doppelganger_copy: { label: "Doppelgänger", role: "doppelganger" },
  doppelganger_action: { label: "Doppelgänger acts", role: "doppelganger" },
  doppelganger_minion: { label: "Doppelgänger-Minion", role: "doppelganger" },
  werewolves: { label: "Werewolves", role: "werewolf" },
  minion: { label: "Minion", role: "minion" },
  masons: { label: "Masons", role: "mason" },
  poacher: { label: "Poacher", role: "poacher" },
  seer: { label: "Seer", role: "seer" },
  robber: { label: "Robber", role: "robber" },
  troublemaker: { label: "Troublemaker", role: "troublemaker" },
  herbalist: { label: "Herbalist", role: "herbalist" },
  drunk: { label: "Drunk", role: "drunk" },
  messenger: { label: "Messenger", role: "messenger" },
  insomniac: { label: "Insomniac", role: "insomniac" },
  doppelganger_insomniac: {
    label: "Doppelgänger-Insomniac",
    role: "doppelganger",
  },
};

export function werewolvesAtNight(state: GameState): PlayerId[] {
  return actorsFor(
    { ...state, nightStep: "werewolves", pendingActorIds: [] },
    "werewolves",
  );
}

export function firstNightStep(state: GameState): NightStep {
  for (const step of NIGHT_STEPS) {
    if (step === "complete") return "complete";
    if (isStepInGame(state, step)) return step;
  }
  return "complete";
}

export function nextNightStep(state: GameState): NightStep {
  const currentIndex = NIGHT_STEPS.indexOf(state.nightStep);
  for (const step of NIGHT_STEPS.slice(currentIndex + 1)) {
    if (step === "complete") return "complete";
    if (isStepInGame(state, step)) return step;
  }
  return "complete";
}

export function enterStep(state: GameState, step: NightStep): GameState {
  if (step === "complete") {
    return {
      ...state,
      nightStep: "complete",
      pendingActorIds: [],
      acknowledgedIds: [],
    };
  }
  return {
    ...state,
    nightStep: step,
    pendingActorIds: actorsFor({ ...state, nightStep: step }, step),
    acknowledgedIds: [],
  };
}

export function beginNight(state: GameState, rng: Rng = Math.random): GameState {
  // The Poacher card's mark is fixed at nightfall: a random other player.
  const poacher = originalHolders(state, "poacher")[0];
  const marks = { ...state.marks };
  if (poacher && !marks.poacher) {
    marks.poacher = pickOther(state, poacher, rng) ?? undefined;
  }
  const cleared: GameState = {
    ...state,
    marks,
    messages: state.messages ?? [],
    flashes: {},
    acknowledgedIds: [],
    pendingActorIds: [],
  };
  return enterStep(cleared, firstNightStep(cleared));
}

export function advanceNight(state: GameState): GameState {
  return enterStep(state, nextNightStep(state));
}

export function nightIsComplete(state: GameState): boolean {
  return state.nightStep === "complete";
}

export function getPrompt(
  state: GameState,
  playerId: PlayerId,
): NightPrompt | null {
  if (!state.pendingActorIds.includes(playerId)) return null;
  if (state.acknowledgedIds.includes(playerId)) return null;
  const others = state.players
    .filter((player) => player.id !== playerId)
    .map((player) => player.id);
  const step = state.nightStep;
  switch (step) {
    case "doppelganger_copy":
      return {
        kind: "doppelganger_copy",
        title: "Doppelgänger",
        instruction:
          "Look at another player’s card. You become that role. If it has a night action, you will do it now.",
        playerIds: others,
        centerCount: 0,
        canSkip: false,
        seenPlayerIds: [],
        seenRoles: [],
        seenCenter: [],
        ownRole: "doppelganger",
      };
    case "doppelganger_action":
      return promptForCopiedAction(state, playerId, others);
    case "doppelganger_minion":
      return acknowledgePrompt(
        "Doppelgänger-Minion",
        "You are the Minion. These players are Werewolves. They cannot see you.",
        {
          seenPlayerIds: werewolvesAtNight(state),
        },
      );
    case "werewolves": {
      const pack = werewolvesAtNight(state);
      const mates = pack.filter((id) => id !== playerId);
      if (pack.length === 1) {
        return {
          kind: "werewolf_lone",
          title: "Lone Wolf",
          instruction:
            "You are the only Werewolf. You may look at one center card.",
          playerIds: [],
          centerCount: 1,
          canSkip: true,
          seenPlayerIds: [],
          seenRoles: [],
          seenCenter: [],
          ownRole: "werewolf",
        };
      }
      return acknowledgePrompt(
        "Werewolves",
        mates.length
          ? "These players are the other Werewolves."
          : "Look for the other Werewolves.",
        { seenPlayerIds: mates },
      );
    }
    case "minion":
      return acknowledgePrompt(
        "Minion",
        "These players are Werewolves. They cannot see you.",
        { seenPlayerIds: werewolvesAtNight(state) },
      );
    case "masons": {
      const masons = actorsFor(state, "masons").filter((id) => id !== playerId);
      return acknowledgePrompt(
        "Masons",
        masons.length
          ? "These players are the other Masons."
          : "You do not see another Mason. The other Mason is in the center.",
        { seenPlayerIds: masons },
      );
    }
    case "poacher":
      return poacherPrompt(state, state.marks?.poacher, false);
    case "seer":
      return seerPrompt(others, false);
    case "robber":
      return robberPrompt(others, false);
    case "troublemaker":
      return troublemakerPrompt(others, false);
    case "herbalist":
      return herbalistPrompt(others, false);
    case "drunk":
      return drunkPrompt(false);
    case "messenger":
      return messengerPrompt(others, false);
    case "insomniac": {
      const card = shownCard(state.current.players[playerId]);
      return acknowledgePrompt(
        "Insomniac",
        "Look at your card to see if it changed.",
        { ownRole: card, seenRoles: card ? [card] : [] },
      );
    }
    case "doppelganger_insomniac": {
      const card = shownCard(state.current.players[playerId]);
      return acknowledgePrompt(
        "Doppelgänger-Insomniac",
        "You viewed the Insomniac. Look at your card to see if it changed.",
        { ownRole: card, seenRoles: card ? [card] : [] },
      );
    }
    case "complete":
      return null;
    default:
      return assertNever(step);
  }
}

function promptForCopiedAction(
  state: GameState,
  playerId: PlayerId,
  others: PlayerId[],
): NightPrompt {
  const copy = state.doppelgangerCopy;
  if (copy === "seer" || copy === "mad_seer") return seerPrompt(others, true);
  if (copy === "robber") return robberPrompt(others, true);
  if (copy === "troublemaker") return troublemakerPrompt(others, true);
  if (copy === "drunk") return drunkPrompt(true);
  if (copy === "herbalist") return herbalistPrompt(others, true);
  if (copy === "messenger") return messengerPrompt(others, true);
  if (copy === "poacher") {
    return poacherPrompt(state, state.marks?.doppelganger, true);
  }
  const shown = copy ? disguise(copy) : null;
  return acknowledgePrompt(
    "Doppelgänger",
    `You are now the ${shown ? displayName(shown) : "copied role"}.`,
    { ownRole: shown, seenRoles: shown ? [shown] : [] },
  );
}

function poacherPrompt(
  state: GameState,
  mark: PlayerId | undefined,
  asDoppelganger: boolean,
): NightPrompt {
  return acknowledgePrompt(
    asDoppelganger ? "Doppelgänger-Poacher" : "Poacher",
    mark
      ? `Your mark is ${nameOf(state, mark)}. You win if they die.`
      : "There is no one for you to hunt tonight.",
    { seenPlayerIds: mark ? [mark] : [], ownRole: "poacher" },
  );
}

function herbalistPrompt(others: PlayerId[], asDoppelganger: boolean): NightPrompt {
  return {
    kind: "herbalist",
    title: asDoppelganger ? "Doppelgänger-Herbalist" : "Herbalist",
    instruction:
      "You may swap another player’s card with a center card. Neither of you looks.",
    playerIds: others,
    centerCount: 1,
    canSkip: true,
    seenPlayerIds: [],
    seenRoles: [],
    seenCenter: [],
    ownRole: "herbalist",
  };
}

function messengerPrompt(others: PlayerId[], asDoppelganger: boolean): NightPrompt {
  return {
    kind: "messenger",
    title: asDoppelganger ? "Doppelgänger-Messenger" : "Messenger",
    instruction: `You may send one anonymous note (up to ${MESSAGE_MAX_LENGTH} characters) to another player. It reaches them at dawn.`,
    playerIds: others,
    centerCount: 0,
    canSkip: true,
    seenPlayerIds: [],
    seenRoles: [],
    seenCenter: [],
    ownRole: "messenger",
  };
}

function seerPrompt(others: PlayerId[], asDoppelganger: boolean): NightPrompt {
  return {
    kind: "seer",
    title: asDoppelganger ? "Doppelgänger-Seer" : "Seer",
    instruction:
      "You may look at another player’s card or two of the center cards.",
    playerIds: others,
    centerCount: 2,
    canSkip: true,
    seenPlayerIds: [],
    seenRoles: [],
    seenCenter: [],
    ownRole: "seer",
  };
}

function robberPrompt(others: PlayerId[], asDoppelganger: boolean): NightPrompt {
  return {
    kind: "robber",
    title: asDoppelganger ? "Doppelgänger-Robber" : "Robber",
    instruction:
      "You may exchange your card with another player’s card, then view your new card.",
    playerIds: others,
    centerCount: 0,
    canSkip: true,
    seenPlayerIds: [],
    seenRoles: [],
    seenCenter: [],
    ownRole: "robber",
  };
}

function troublemakerPrompt(
  others: PlayerId[],
  asDoppelganger: boolean,
): NightPrompt {
  return {
    kind: "troublemaker",
    title: asDoppelganger ? "Doppelgänger-Troublemaker" : "Troublemaker",
    instruction: "You may exchange cards between two other players.",
    playerIds: others,
    centerCount: 0,
    canSkip: true,
    seenPlayerIds: [],
    seenRoles: [],
    seenCenter: [],
    ownRole: "troublemaker",
  };
}

function drunkPrompt(asDoppelganger: boolean): NightPrompt {
  return {
    kind: "drunk",
    title: asDoppelganger ? "Doppelgänger-Drunk" : "Drunk",
    instruction: "Exchange your card with a card from the center. Do not look.",
    playerIds: [],
    centerCount: 1,
    canSkip: false,
    seenPlayerIds: [],
    seenRoles: [],
    seenCenter: [],
    ownRole: "drunk",
  };
}

function acknowledgePrompt(
  title: string,
  instruction: string,
  extra: Partial<NightPrompt> = {},
): NightPrompt {
  return {
    kind: "acknowledge",
    title,
    instruction,
    playerIds: [],
    centerCount: 0,
    canSkip: false,
    seenPlayerIds: extra.seenPlayerIds ?? [],
    seenRoles: extra.seenRoles ?? [],
    seenCenter: extra.seenCenter ?? [],
    ownRole: extra.ownRole ?? null,
  };
}

export function applyNightAction(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  rng: Rng = Math.random,
): GameState {
  if (state.nightStep === "complete") {
    throw new Error("Night is already complete.");
  }
  if (!state.pendingActorIds.includes(playerId)) {
    throw new Error("It is not this player’s turn.");
  }
  if (state.acknowledgedIds.includes(playerId)) {
    throw new Error("This player already acted this step.");
  }

  const step = state.nightStep;
  switch (step) {
    case "doppelganger_copy":
      return finishStep(
        applyDoppelgangerCopy(state, playerId, action, rng),
        playerId,
      );
    case "doppelganger_action":
      return finishStep(
        applyCopiedImmediate(state, playerId, action, rng),
        playerId,
      );
    case "doppelganger_minion":
      return finishStep(
        applyAcknowledgeOnly(state, playerId, action, minionLog(state, playerId, true)),
        playerId,
      );
    case "werewolves":
      return finishStep(applyWerewolf(state, playerId, action), playerId);
    case "minion":
      return finishStep(
        applyAcknowledgeOnly(state, playerId, action, minionLog(state, playerId, false)),
        playerId,
      );
    case "masons":
      return finishStep(applyMasonAck(state, playerId, action), playerId);
    case "poacher":
      return finishStep(applyPoacher(state, playerId, action, false), playerId);
    case "seer":
      return finishStep(
        applySeer(state, playerId, action, {
          asDoppelganger: false,
          mad: state.original.players[playerId] === "mad_seer",
          rng,
        }),
        playerId,
      );
    case "robber":
      return finishStep(applyRobber(state, playerId, action, false), playerId);
    case "troublemaker":
      return finishStep(
        applyTroublemaker(state, playerId, action, false),
        playerId,
      );
    case "herbalist":
      return finishStep(applyHerbalist(state, playerId, action, false), playerId);
    case "drunk":
      return finishStep(applyDrunk(state, playerId, action, false), playerId);
    case "messenger":
      return finishStep(applyMessenger(state, playerId, action, false), playerId);
    case "insomniac":
      return finishStep(applyInsomniac(state, playerId, action, false), playerId);
    case "doppelganger_insomniac":
      return finishStep(applyInsomniac(state, playerId, action, true), playerId);
    default:
      return assertNever(step);
  }
}

function finishStep(state: GameState, playerId: PlayerId): GameState {
  const acknowledgedIds = unique([...state.acknowledgedIds, playerId]);
  const remaining = state.pendingActorIds.filter(
    (id) => !acknowledgedIds.includes(id),
  );
  const next: GameState = { ...state, acknowledgedIds };
  if (remaining.length > 0) return next;
  return advanceNight(next);
}

function applyDoppelgangerCopy(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  rng: Rng,
): GameState {
  if (action.kind !== "doppelganger_copy") {
    throw new Error("Doppelgänger must look at another player’s card.");
  }
  if (action.targetPlayerId === playerId) {
    throw new Error("Doppelgänger cannot look at their own card.");
  }
  const viewed = state.current.players[action.targetPlayerId];
  if (!viewed) throw new Error("Unknown target.");
  const targetName = playerName(state.players, action.targetPlayerId);
  // A copied Mad Seer looks like a Seer, so the Doppelgänger is fooled too.
  const shown = disguise(viewed);
  const flash: FlashReveal = {
    title: "You are now the " + displayName(shown),
    body: `You looked at ${targetName}’s card.`,
    roles: [shown],
    playerIds: [action.targetPlayerId],
    centerIndexes: [],
  };
  const marks =
    viewed === "poacher"
      ? { ...state.marks, doppelganger: pickOther(state, playerId, rng) ?? undefined }
      : state.marks;
  return {
    ...state,
    marks,
    doppelgangerCopy: viewed,
    flashes: { ...state.flashes, [playerId]: flash },
    nightLog: [
      ...state.nightLog,
      log(
        state.nightStep,
        [playerId],
        `${nameOf(state, playerId)} (Doppelgänger) looked at ${targetName}’s card and became the ${seenAs(viewed)}.`,
      ),
    ],
  };
}

function applyCopiedImmediate(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  rng: Rng,
): GameState {
  const copy = state.doppelgangerCopy;
  if (copy === "seer" || copy === "mad_seer") {
    return applySeer(state, playerId, action, {
      asDoppelganger: true,
      mad: copy === "mad_seer",
      rng,
    });
  }
  if (copy === "robber") return applyRobber(state, playerId, action, true);
  if (copy === "troublemaker") {
    return applyTroublemaker(state, playerId, action, true);
  }
  if (copy === "drunk") return applyDrunk(state, playerId, action, true);
  if (copy === "herbalist") return applyHerbalist(state, playerId, action, true);
  if (copy === "messenger") return applyMessenger(state, playerId, action, true);
  if (copy === "poacher") return applyPoacher(state, playerId, action, true);
  throw new Error("Doppelgänger has no immediate action.");
}

function applyWerewolf(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
): GameState {
  const pack = werewolvesAtNight(state);
  if (pack.length === 1) {
    if (action.kind === "werewolf_lone_skip" || action.kind === "acknowledge") {
      return withLog(
        state,
        log(
          state.nightStep,
          [playerId],
          `${nameOf(state, playerId)} was the lone Werewolf and did not look at a center card.`,
        ),
      );
    }
    if (action.kind !== "werewolf_lone") {
      throw new Error("Lone Wolf must pick a center card or skip.");
    }
    const role = centerRole(state, action.centerIndex);
    const shown = disguise(role);
    return {
      ...state,
      flashes: {
        ...state.flashes,
        [playerId]: {
          title: "Center card",
          body: `The ${CENTER_LABELS[action.centerIndex]} card is the ${displayName(shown)}.`,
          roles: [shown],
          playerIds: [],
          centerIndexes: [action.centerIndex],
        },
      },
      nightLog: [
        ...state.nightLog,
        log(
          state.nightStep,
          [playerId],
          `${nameOf(state, playerId)} (lone Werewolf) looked at the ${CENTER_LABELS[action.centerIndex]} center card: ${seenAs(role)}.`,
        ),
      ],
    };
  }
  requireAck(action);
  if (state.acknowledgedIds.length > 0) return state;
  const names = pack.map((id) => nameOf(state, id)).join(", ");
  return withLog(
    state,
    log(
      state.nightStep,
      pack,
      `Werewolves saw each other: ${names}.`,
    ),
  );
}

function applyMasonAck(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
): GameState {
  requireAck(action);
  if (state.acknowledgedIds.length > 0) return state;
  const masons = actorsFor(state, "masons");
  const names = masons.map((id) => nameOf(state, id)).join(", ");
  const summary =
    masons.length <= 1
      ? `${nameOf(state, playerId)} (Mason) saw no other Mason.`
      : `Masons saw each other: ${names}.`;
  return withLog(state, log(state.nightStep, masons, summary));
}

function applySeer(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  opts: { asDoppelganger: boolean; mad: boolean; rng: Rng },
): GameState {
  const title = opts.mad
    ? opts.asDoppelganger
      ? "Doppelgänger-Mad Seer"
      : "Mad Seer"
    : opts.asDoppelganger
      ? "Doppelgänger-Seer"
      : "Seer";
  const actor = label(state, playerId, title);
  if (action.kind === "seer_skip" || action.kind === "acknowledge") {
    return withLog(state, log(state.nightStep, [playerId], `${actor} looked at nothing.`));
  }
  if (action.kind === "seer_player") {
    if (action.targetPlayerId === playerId) {
      throw new Error("Seer cannot look at their own card.");
    }
    const role = state.current.players[action.targetPlayerId];
    if (!role) throw new Error("Unknown target.");
    const [shown] = opts.mad
      ? madVisions(state, playerId, [role], opts.rng)
      : [disguise(role)];
    const targetName = nameOf(state, action.targetPlayerId);
    return {
      ...state,
      flashes: {
        ...state.flashes,
        [playerId]: {
          title: `${targetName}’s card`,
          body: `${targetName} has the ${displayName(shown!)}.`,
          roles: [shown!],
          playerIds: [action.targetPlayerId],
          centerIndexes: [],
        },
      },
      nightLog: [
        ...state.nightLog,
        log(
          state.nightStep,
          [playerId],
          opts.mad
            ? `${actor} looked at ${targetName}’s card and was shown the ${displayName(shown!)}. It was really the ${displayName(role)}.`
            : `${actor} looked at ${targetName}’s card: ${seenAs(role)}.`,
        ),
      ],
    };
  }
  if (action.kind !== "seer_center") {
    throw new Error("Seer must look at a player, two center cards, or skip.");
  }
  const [a, b] = action.centerIndexes;
  if (a === b || a < 0 || a > 2 || b < 0 || b > 2) {
    throw new Error("Seer must pick two different center cards.");
  }
  const roleA = centerRole(state, a);
  const roleB = centerRole(state, b);
  const [shownA, shownB] = opts.mad
    ? madVisions(state, playerId, [roleA, roleB], opts.rng)
    : [disguise(roleA), disguise(roleB)];
  return {
    ...state,
    flashes: {
      ...state.flashes,
      [playerId]: {
        title: "Center cards",
        body: `${CENTER_LABELS[a]} is the ${displayName(shownA!)}. ${CENTER_LABELS[b]} is the ${displayName(shownB!)}.`,
        roles: [shownA!, shownB!],
        playerIds: [],
        centerIndexes: [a, b],
      },
    },
    nightLog: [
      ...state.nightLog,
      log(
        state.nightStep,
        [playerId],
        opts.mad
          ? `${actor} looked at the ${CENTER_LABELS[a]} and ${CENTER_LABELS[b]} center cards and was shown ${displayName(shownA!)}, ${displayName(shownB!)}. They were really ${displayName(roleA)}, ${displayName(roleB)}.`
          : `${actor} looked at the ${CENTER_LABELS[a]} and ${CENTER_LABELS[b]} center cards: ${seenAs(roleA)}, ${seenAs(roleB)}.`,
      ),
    ],
  };
}

/**
 * What the Mad Seer is shown: a wrong role for every card. The lies are drawn
 * from the deck (so they're plausible), never repeat a card more often than
 * the deck holds it, and never match what the card really looks like.
 */
export function madVisions(
  state: GameState,
  viewerId: PlayerId,
  actual: Role[],
  rng: Rng,
): Role[] {
  const pool = state.deck.map(disguise);
  // The viewer's own card isn't out there to be seen.
  const own = state.original.players[viewerId];
  const ownIndex = own ? pool.indexOf(disguise(own)) : -1;
  if (ownIndex !== -1) pool.splice(ownIndex, 1);
  return actual.map((role) => {
    const truth = disguise(role);
    const options = pool.filter((item) => item !== truth);
    const fallback = ROLES.filter(
      (item) => item !== truth && item === disguise(item),
    );
    const choices = options.length ? options : fallback;
    const lie = choices[Math.floor(rng() * choices.length)] ?? "villager";
    const used = pool.indexOf(lie);
    if (used !== -1) pool.splice(used, 1);
    return lie;
  });
}

function applyRobber(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  asDoppelganger: boolean,
): GameState {
  const actor = label(
    state,
    playerId,
    asDoppelganger ? "Doppelgänger-Robber" : "Robber",
  );
  if (action.kind === "robber_skip" || action.kind === "acknowledge") {
    return withLog(
      state,
      log(state.nightStep, [playerId], `${actor} chose not to rob.`),
    );
  }
  if (action.kind !== "robber") {
    throw new Error("Robber must pick a player or skip.");
  }
  if (action.targetPlayerId === playerId) {
    throw new Error("Robber cannot rob themselves.");
  }
  const stolen = state.current.players[action.targetPlayerId];
  if (!stolen) throw new Error("Unknown target.");
  const targetName = nameOf(state, action.targetPlayerId);
  return {
    ...state,
    current: swapPlayers(state.current, playerId, action.targetPlayerId),
    flashes: {
      ...state.flashes,
      [playerId]: {
        title: "Your new card",
        body: `You robbed ${targetName} and are now the ${displayName(disguise(stolen))}.`,
        roles: [disguise(stolen)],
        playerIds: [action.targetPlayerId],
        centerIndexes: [],
      },
    },
    nightLog: [
      ...state.nightLog,
      log(
        state.nightStep,
        [playerId],
        `${actor} swapped with ${targetName} and became the ${seenAs(stolen)}.`,
      ),
    ],
  };
}

function applyTroublemaker(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  asDoppelganger: boolean,
): GameState {
  const actor = label(
    state,
    playerId,
    asDoppelganger ? "Doppelgänger-Troublemaker" : "Troublemaker",
  );
  if (action.kind === "troublemaker_skip" || action.kind === "acknowledge") {
    return withLog(
      state,
      log(state.nightStep, [playerId], `${actor} chose not to swap anyone.`),
    );
  }
  if (action.kind !== "troublemaker") {
    throw new Error("Troublemaker must pick two players or skip.");
  }
  const { playerAId, playerBId } = action;
  if (playerAId === playerBId) {
    throw new Error("Troublemaker must pick two different players.");
  }
  if (playerAId === playerId || playerBId === playerId) {
    throw new Error("Troublemaker cannot swap their own card.");
  }
  if (!state.current.players[playerAId] || !state.current.players[playerBId]) {
    throw new Error("Unknown target.");
  }
  return {
    ...state,
    current: swapPlayers(state.current, playerAId, playerBId),
    nightLog: [
      ...state.nightLog,
      log(
        state.nightStep,
        [playerId],
        `${actor} swapped ${nameOf(state, playerAId)} and ${nameOf(state, playerBId)}.`,
      ),
    ],
  };
}

function applyDrunk(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  asDoppelganger: boolean,
): GameState {
  if (action.kind !== "drunk") {
    throw new Error("Drunk must swap with a center card.");
  }
  const actor = label(
    state,
    playerId,
    asDoppelganger ? "Doppelgänger-Drunk" : "Drunk",
  );
  const taken = centerRole(state, action.centerIndex);
  return {
    ...state,
    current: swapPlayerWithCenter(state.current, playerId, action.centerIndex),
    nightLog: [
      ...state.nightLog,
      log(
        state.nightStep,
        [playerId],
        `${actor} swapped with the ${CENTER_LABELS[action.centerIndex]} center card (now the ${displayName(taken)}, unseen).`,
      ),
    ],
  };
}

function applyInsomniac(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  asDoppelganger: boolean,
): GameState {
  requireAck(action);
  const card = state.current.players[playerId];
  if (!card) throw new Error("Missing card.");
  const actor = label(
    state,
    playerId,
    asDoppelganger ? "Doppelgänger-Insomniac" : "Insomniac",
  );
  return {
    ...state,
    flashes: {
      ...state.flashes,
      [playerId]: {
        title: "Your card",
        body: `Your card is the ${displayName(disguise(card))}.`,
        roles: [disguise(card)],
        playerIds: [],
        centerIndexes: [],
      },
    },
    nightLog: [
      ...state.nightLog,
      log(
        state.nightStep,
        [playerId],
        `${actor} looked at their card: ${seenAs(card)}.`,
      ),
    ],
  };
}

function applyPoacher(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  asDoppelganger: boolean,
): GameState {
  requireAck(action);
  const mark = asDoppelganger ? state.marks?.doppelganger : state.marks?.poacher;
  const actor = label(
    state,
    playerId,
    asDoppelganger ? "Doppelgänger-Poacher" : "Poacher",
  );
  return withLog(
    state,
    log(
      state.nightStep,
      [playerId],
      mark ? `${actor} learned their mark: ${nameOf(state, mark)}.` : `${actor} had no mark.`,
    ),
  );
}

function applyHerbalist(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  asDoppelganger: boolean,
): GameState {
  const actor = label(
    state,
    playerId,
    asDoppelganger ? "Doppelgänger-Herbalist" : "Herbalist",
  );
  if (action.kind === "herbalist_skip" || action.kind === "acknowledge") {
    return withLog(
      state,
      log(state.nightStep, [playerId], `${actor} chose not to swap anyone.`),
    );
  }
  if (action.kind !== "herbalist") {
    throw new Error("Herbalist must pick a player and a center card, or skip.");
  }
  if (action.targetPlayerId === playerId) {
    throw new Error("Herbalist cannot swap their own card.");
  }
  if (!state.current.players[action.targetPlayerId]) {
    throw new Error("Unknown target.");
  }
  const given = centerRole(state, action.centerIndex);
  const targetName = nameOf(state, action.targetPlayerId);
  return {
    ...state,
    current: swapPlayerWithCenter(
      state.current,
      action.targetPlayerId,
      action.centerIndex,
    ),
    nightLog: [
      ...state.nightLog,
      log(
        state.nightStep,
        [playerId],
        `${actor} swapped ${targetName}’s card with the ${CENTER_LABELS[action.centerIndex]} center card (${targetName} is now the ${displayName(given)}, unseen).`,
      ),
    ],
  };
}

/** Tidy a Messenger note: one line, no control characters, trimmed. */
export function cleanMessage(text: unknown): string {
  if (typeof text !== "string") return "";
  return text
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function applyMessenger(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  asDoppelganger: boolean,
): GameState {
  const actor = label(
    state,
    playerId,
    asDoppelganger ? "Doppelgänger-Messenger" : "Messenger",
  );
  if (action.kind === "messenger_skip" || action.kind === "acknowledge") {
    return withLog(
      state,
      log(state.nightStep, [playerId], `${actor} sent no message.`),
    );
  }
  if (action.kind !== "messenger") {
    throw new Error("Messenger must write a note to a player, or skip.");
  }
  if (action.targetPlayerId === playerId) {
    throw new Error("Messenger cannot send a note to themselves.");
  }
  if (!state.current.players[action.targetPlayerId]) {
    throw new Error("Unknown target.");
  }
  const text = cleanMessage(action.text);
  if (!text) throw new Error("Write a message, or skip.");
  if (text.length > MESSAGE_MAX_LENGTH) {
    throw new Error(`Keep it to ${MESSAGE_MAX_LENGTH} characters.`);
  }
  const targetName = nameOf(state, action.targetPlayerId);
  return {
    ...state,
    messages: [
      ...(state.messages ?? []),
      { from: playerId, to: action.targetPlayerId, text },
    ],
    flashes: {
      ...state.flashes,
      [playerId]: {
        title: "Note sent",
        body: `${targetName} will find it at dawn: “${text}”`,
        roles: [],
        playerIds: [action.targetPlayerId],
        centerIndexes: [],
      },
    },
    nightLog: [
      ...state.nightLog,
      log(state.nightStep, [playerId], `${actor} sent ${targetName} a note: “${text}”`),
    ],
  };
}

/** A random player other than `playerId`, or null if they're alone. */
function pickOther(state: GameState, playerId: PlayerId, rng: Rng): PlayerId | null {
  const others = state.players.filter((p) => p.id !== playerId);
  if (others.length === 0) return null;
  return others[Math.floor(rng() * others.length)]?.id ?? others[0]!.id;
}

/** What a player sees when they look at a card before the reveal. */
function shownCard(card: Role | undefined): Role | null {
  return card ? disguise(card) : null;
}

/** A role's name for the night log, noting when it looked like something else. */
function seenAs(role: Role): string {
  const shown = disguise(role);
  return shown === role
    ? displayName(role)
    : `${displayName(role)} (it looks like the ${displayName(shown)})`;
}

function applyAcknowledgeOnly(
  state: GameState,
  playerId: PlayerId,
  action: NightAction,
  entry: NightLogEntry,
): GameState {
  requireAck(action);
  if (state.acknowledgedIds.length > 0) return state;
  return withLog(state, entry);
}

function minionLog(
  state: GameState,
  playerId: PlayerId,
  asDoppelganger: boolean,
): NightLogEntry {
  const wolves = werewolvesAtNight(state);
  const names = wolves.length
    ? wolves.map((id) => nameOf(state, id)).join(", ")
    : "nobody";
  const actor = label(
    state,
    playerId,
    asDoppelganger ? "Doppelgänger-Minion" : "Minion",
  );
  return log(
    state.nightStep,
    [playerId],
    `${actor} saw Werewolves: ${names}.`,
  );
}

function requireAck(action: NightAction): void {
  if (action.kind !== "acknowledge") {
    throw new Error("This role must acknowledge.");
  }
}

function centerRole(state: GameState, index: number): Role {
  if (index < 0 || index > 2) throw new Error("Invalid center index.");
  const role = state.current.center[index];
  if (!role) throw new Error("Missing center card.");
  return role;
}

function nameOf(state: GameState, playerId: PlayerId): string {
  return playerName(state.players, playerId);
}

function label(state: GameState, playerId: PlayerId, roleLabel: string): string {
  return `${nameOf(state, playerId)} (${roleLabel})`;
}

function log(
  step: NightStep,
  actorIds: PlayerId[],
  summary: string,
): NightLogEntry {
  return { step, actorIds, summary };
}

function withLog(state: GameState, entry: NightLogEntry): GameState {
  return { ...state, nightLog: [...state.nightLog, entry] };
}

function unique(ids: PlayerId[]): PlayerId[] {
  return [...new Set(ids)];
}

export function skipEmptyStepsForTests(state: GameState): GameState {
  let current = state;
  while (
    current.nightStep !== "complete" &&
    current.pendingActorIds.length === 0
  ) {
    current = advanceNight(current);
  }
  return current;
}

export function runScriptedNight(
  state: GameState,
  choose: (ctx: {
    playerId: PlayerId;
    step: NightStep;
    prompt: NightPrompt;
  }) => NightAction,
): GameState {
  let current = beginNight(state);
  current = skipEmptyStepsForTests(current);
  let guard = 0;
  while (current.nightStep !== "complete") {
    guard += 1;
    if (guard > 200) throw new Error("Night script did not terminate.");
    const actorId = current.pendingActorIds.find(
      (id) => !current.acknowledgedIds.includes(id),
    );
    if (!actorId) {
      current = skipEmptyStepsForTests(advanceNight(current));
      continue;
    }
    const prompt = getPrompt(current, actorId);
    if (!prompt) {
      throw new Error("Actor has no prompt.");
    }
    const action = choose({
      playerId: actorId,
      step: current.nightStep,
      prompt,
    });
    current = applyNightAction(current, actorId, action);
    current = skipEmptyStepsForTests(current);
  }
  return current;
}
