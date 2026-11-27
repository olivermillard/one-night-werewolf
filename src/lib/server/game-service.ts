import type { Command } from "@/lib/commands";
import {
  beginNight,
  createDealtState,
  getPrompt,
  hardValidateDeck,
  nightIsComplete,
  recommendedDeck,
  resolveVotes,
  normalizeVotes,
  validateBallot,
  type GameState,
  type Phase,
  type Player,
  type Role,
  ROLES,
} from "@/lib/game";
import {
  advanceNight,
  applyNightAction,
  publicNightSteps,
} from "@/lib/game/night";
import { emptyStepDelayMs, tokensMatch } from "@/lib/server/auth";
import { HttpError } from "@/lib/server/http";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type {
  GameView,
  NightProgress,
  PrivateView,
  PublicPlayer,
  PublicRoom,
  RevealPayload,
} from "@/lib/view";

export interface RoomRow {
  id: string;
  code: string;
  phase: Phase;
  host_player_id: string | null;
  deck: Role[];
  day_timer_seconds: number;
  day_ends_at: string | null;
  view_version: number;
  round: number;
}

export interface PlayerRow {
  id: string;
  room_id: string;
  name: string;
  is_host: boolean;
  ready: boolean;
  seat: number;
}

interface SecretRow {
  room_id: string;
  state: GameState;
  night_advance_at: string | null;
}

export type { Command };

function withNormalizedVotes(state: GameState): GameState {
  return { ...state, votes: normalizeVotes(state.votes) };
}

function asRoles(value: unknown): Role[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Role =>
    ROLES.includes(item as Role),
  );
}

function asPhase(value: unknown): Phase {
  const phases: Phase[] = ["lobby", "deal", "night", "day", "vote", "reveal"];
  if (typeof value === "string" && phases.includes(value as Phase)) {
    return value as Phase;
  }
  return "lobby";
}

function mapRoom(row: Record<string, unknown>): RoomRow {
  return {
    id: String(row.id),
    code: String(row.code),
    phase: asPhase(row.phase),
    host_player_id: row.host_player_id ? String(row.host_player_id) : null,
    deck: asRoles(row.deck),
    day_timer_seconds: Number(row.day_timer_seconds ?? 300),
    day_ends_at: row.day_ends_at ? String(row.day_ends_at) : null,
    view_version: Number(row.view_version ?? 0),
    round: Number(row.round ?? 0),
  };
}

function mapPlayer(row: Record<string, unknown>): PlayerRow {
  return {
    id: String(row.id),
    room_id: String(row.room_id),
    name: String(row.name),
    is_host: Boolean(row.is_host),
    ready: Boolean(row.ready),
    seat: Number(row.seat ?? 0),
  };
}

function toEnginePlayers(players: PlayerRow[]): Player[] {
  return [...players]
    .sort((a, b) => a.seat - b.seat)
    .map((player) => ({ id: player.id, name: player.name }));
}

function publicPlayers(players: PlayerRow[]): PublicPlayer[] {
  return [...players]
    .sort((a, b) => a.seat - b.seat)
    .map((player) => ({
      id: player.id,
      name: player.name,
      isHost: player.is_host,
      ready: player.ready,
    }));
}

function requireHost(player: PlayerRow): void {
  if (!player.is_host) throw new HttpError(403, "Only the host can do that.");
}

async function loadRoom(code: string): Promise<{
  room: RoomRow;
  players: PlayerRow[];
  secret: SecretRow | null;
}> {
  const db = supabaseAdmin();
  const { data: roomData, error: roomError } = await db
    .from("rooms")
    .select(
      "id, code, phase, host_player_id, deck, day_timer_seconds, day_ends_at, view_version, round",
    )
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (roomError) throw new HttpError(500, roomError.message);
  if (!roomData) throw new HttpError(404, "Room not found.");
  const room = mapRoom(roomData as Record<string, unknown>);
  const { data: playerData, error: playerError } = await db
    .from("players")
    .select("id, room_id, name, is_host, ready, seat")
    .eq("room_id", room.id)
    .order("seat", { ascending: true });
  if (playerError) throw new HttpError(500, playerError.message);
  const players = (playerData ?? []).map((row) =>
    mapPlayer(row as Record<string, unknown>),
  );
  const { data: secretData, error: secretError } = await db
    .from("game_secrets")
    .select("room_id, state, night_advance_at")
    .eq("room_id", room.id)
    .maybeSingle();
  if (secretError) throw new HttpError(500, secretError.message);
  const secret = secretData
    ? {
        room_id: String(secretData.room_id),
        state: withNormalizedVotes(secretData.state as GameState),
        night_advance_at: secretData.night_advance_at
          ? String(secretData.night_advance_at)
          : null,
      }
    : null;
  return { room, players, secret };
}

async function verifyPlayer(
  playerId: string,
  token: string,
): Promise<PlayerRow> {
  const db = supabaseAdmin();
  const { data: player, error } = await db
    .from("players")
    .select("id, room_id, name, is_host, ready, seat")
    .eq("id", playerId)
    .maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!player) throw new HttpError(401, "Unknown player.");
  const { data: auth, error: authError } = await db
    .from("player_auth")
    .select("token_hash")
    .eq("player_id", playerId)
    .maybeSingle();
  if (authError) throw new HttpError(500, authError.message);
  if (!auth || !tokensMatch(token, String(auth.token_hash))) {
    throw new HttpError(401, "Invalid session.");
  }
  return mapPlayer(player as Record<string, unknown>);
}

function configureNightTiming(
  state: GameState,
  now: Date,
): { phase: Phase; nightAdvanceAt: string | null; dayEndsAt?: string } {
  if (nightIsComplete(state)) {
    return { phase: "day", nightAdvanceAt: null };
  }
  if (state.pendingActorIds.length === 0) {
    return {
      phase: "night",
      nightAdvanceAt: new Date(now.getTime() + emptyStepDelayMs()).toISOString(),
    };
  }
  return { phase: "night", nightAdvanceAt: null };
}

function applyClock(
  room: RoomRow,
  players: PlayerRow[],
  secret: SecretRow | null,
  now: Date,
): { room: RoomRow; secret: SecretRow | null; changed: boolean } {
  let changed = false;
  let nextRoom = room;
  let nextSecret = secret;

  if (nextRoom.phase === "night" && nextSecret) {
    if (
      nextSecret.night_advance_at &&
      new Date(nextSecret.night_advance_at).getTime() <= now.getTime() &&
      nextSecret.state.pendingActorIds.length === 0 &&
      !nightIsComplete(nextSecret.state)
    ) {
      const advanced = advanceNight(nextSecret.state);
      const timing = configureNightTiming(advanced, now);
      nextSecret = {
        ...nextSecret,
        state: advanced,
        night_advance_at: timing.nightAdvanceAt,
      };
      if (timing.phase === "day") {
        nextRoom = {
          ...nextRoom,
          phase: "day",
          day_ends_at: new Date(
            now.getTime() + nextRoom.day_timer_seconds * 1000,
          ).toISOString(),
        };
        nextSecret = { ...nextSecret, night_advance_at: null };
      }
      changed = true;
    }
  }

  if (
    nextRoom.phase === "day" &&
    nextRoom.day_ends_at &&
    new Date(nextRoom.day_ends_at).getTime() <= now.getTime()
  ) {
    nextRoom = { ...nextRoom, phase: "vote", day_ends_at: nextRoom.day_ends_at };
    changed = true;
  }

  if (nextRoom.phase === "vote" && nextSecret) {
    const everyoneVoted = players.every(
      (player) => nextSecret!.state.votes[player.id]?.length,
    );
    if (players.length >= 3 && everyoneVoted) {
      const resolution = resolveVotes({
        players: toEnginePlayers(players),
        current: nextSecret.state.current,
        doppelgangerCopy: nextSecret.state.doppelgangerCopy,
        votes: nextSecret.state.votes,
      });
      nextSecret = {
        ...nextSecret,
        state: {
          ...nextSecret.state,
          deaths: resolution.deaths,
          winners: resolution.winners,
        },
      };
      nextRoom = { ...nextRoom, phase: "reveal" };
      changed = true;
    }
  }

  return { room: nextRoom, secret: nextSecret, changed };
}

async function persist(args: {
  previous: RoomRow;
  room: RoomRow;
  secret: SecretRow | null;
  bump: boolean;
}): Promise<RoomRow> {
  const db = supabaseAdmin();
  const viewVersion = args.bump
    ? args.previous.view_version + 1
    : args.previous.view_version;
  const { data, error } = await db
    .from("rooms")
    .update({
      phase: args.room.phase,
      host_player_id: args.room.host_player_id,
      deck: args.room.deck,
      day_timer_seconds: args.room.day_timer_seconds,
      day_ends_at: args.room.day_ends_at,
      view_version: viewVersion,
      round: args.room.round,
    })
    .eq("id", args.previous.id)
    .eq("view_version", args.previous.view_version)
    .select(
      "id, code, phase, host_player_id, deck, day_timer_seconds, day_ends_at, view_version, round",
    )
    .maybeSingle();
  if (error) throw new HttpError(500, error.message);
  if (!data) throw new HttpError(409, "Room was updated. Retry.");
  if (args.secret) {
    const { error: secretError } = await db.from("game_secrets").upsert({
      room_id: args.previous.id,
      state: args.secret.state,
      night_advance_at: args.secret.night_advance_at,
    });
    if (secretError) throw new HttpError(500, secretError.message);
  }
  return mapRoom(data as Record<string, unknown>);
}

function buildReveal(state: GameState): RevealPayload {
  const resolution = resolveVotes({
    players: state.players,
    current: state.current,
    doppelgangerCopy: state.doppelgangerCopy,
    votes: state.votes,
  });
  return {
    votes: state.votes,
    tally: resolution.tally,
    deaths: state.deaths,
    winners: state.winners ?? resolution.winners,
    originalPlayers: state.original.players,
    finalPlayers: state.current.players,
    originalCenter: [...state.original.center],
    finalCenter: [...state.current.center],
    doppelgangerCopy: state.doppelgangerCopy,
    nightLog: state.nightLog,
  };
}

function buildView(
  room: RoomRow,
  players: PlayerRow[],
  secret: SecretRow | null,
  me: PlayerRow,
): GameView {
  const publicRoom: PublicRoom = {
    id: room.id,
    code: room.code,
    phase: room.phase,
    viewVersion: room.view_version,
    players: publicPlayers(players),
    deck: room.deck,
    dayTimerSeconds: room.day_timer_seconds,
    dayEndsAt: room.day_ends_at,
    hostPlayerId: room.host_player_id,
    round: room.round,
  };
  const mePublic: PublicPlayer = {
    id: me.id,
    name: me.name,
    isHost: me.is_host,
    ready: me.ready,
  };
  const privateView: PrivateView = {
    originalRole: null,
    prompt: null,
    flash: null,
    eyesClosed: room.phase === "night",
    myVotes: [],
    voteCount: secret ? Object.keys(secret.state.votes).length : 0,
    playerCount: players.length,
    reveal: null,
  };

  if (secret) {
    // Players see their card once at the deal, then not again until the
    // reveal (as at a real table). Night prompts carry what a role may see.
    const showOriginal = room.phase === "deal" || room.phase === "reveal";
    if (showOriginal) {
      privateView.originalRole = secret.state.original.players[me.id] ?? null;
    }
    if (room.phase === "night") {
      privateView.prompt = getPrompt(secret.state, me.id);
      privateView.flash = secret.state.flashes[me.id] ?? null;
      privateView.eyesClosed = !privateView.prompt;
    }
    if (room.phase === "vote" || room.phase === "reveal") {
      privateView.myVotes = secret.state.votes[me.id] ?? [];
    }
    if (room.phase === "reveal") {
      privateView.reveal = buildReveal(secret.state);
      privateView.eyesClosed = false;
    }
  }

  let night: NightProgress | null = null;
  if (secret && room.phase === "night") {
    const steps = publicNightSteps(secret.state.deck);
    const step = secret.state.nightStep;
    const index = step === "complete" ? -1 : steps.indexOf(step);
    night = { steps, current: index === -1 ? steps.length : index };
  }

  return { room: publicRoom, me: mePublic, private: privateView, night };
}

async function savePlayersReady(players: PlayerRow[]): Promise<void> {
  const db = supabaseAdmin();
  for (const player of players) {
    const { error } = await db
      .from("players")
      .update({ ready: player.ready })
      .eq("id", player.id);
    if (error) throw new HttpError(500, error.message);
  }
}

function beginDealtNight(
  room: RoomRow,
  secretState: GameState,
  now: Date,
): { room: RoomRow; secret: SecretRow } {
  const nightState = beginNight(secretState);
  const timing = configureNightTiming(nightState, now);
  const nextRoom: RoomRow = { ...room, phase: timing.phase };
  if (timing.phase === "day") {
    nextRoom.day_ends_at = new Date(
      now.getTime() + room.day_timer_seconds * 1000,
    ).toISOString();
  }
  return {
    room: nextRoom,
    secret: {
      room_id: room.id,
      state: nightState,
      night_advance_at: timing.nightAdvanceAt,
    },
  };
}

export async function getView(args: {
  code: string;
  playerId: string;
  token: string;
}): Promise<GameView> {
  const me = await verifyPlayer(args.playerId, args.token);
  const loaded = await loadRoom(args.code);
  if (me.room_id !== loaded.room.id) {
    throw new HttpError(403, "You are not in this room.");
  }
  const clocked = applyClock(
    loaded.room,
    loaded.players,
    loaded.secret,
    new Date(),
  );
  let room = clocked.room;
  const secret = clocked.secret;
  if (clocked.changed) {
    try {
      room = await persist({
        previous: loaded.room,
        room,
        secret,
        bump: true,
      });
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 409) throw error;
      const latest = await loadRoom(args.code);
      return buildView(latest.room, latest.players, latest.secret, me);
    }
  }
  return buildView(room, loaded.players, secret, me);
}

class VersionConflict extends Error {}

const COMMAND_ATTEMPTS = 5;

export async function runCommand(args: {
  code: string;
  playerId: string;
  token: string;
  command: Command;
}): Promise<GameView> {
  // Another request may bump the room between our read and write. Re-run the
  // command against fresh state instead of silently dropping it.
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await runCommandOnce(args);
    } catch (error) {
      if (!(error instanceof VersionConflict)) throw error;
      if (attempt >= COMMAND_ATTEMPTS) {
        throw new HttpError(409, "The table is busy. Please try again.");
      }
      await new Promise((resolve) =>
        setTimeout(resolve, 20 + Math.random() * 60 * attempt),
      );
    }
  }
}

async function runCommandOnce(args: {
  code: string;
  playerId: string;
  token: string;
  command: Command;
}): Promise<GameView> {
  const me = await verifyPlayer(args.playerId, args.token);
  const loaded = await loadRoom(args.code);
  if (me.room_id !== loaded.room.id) {
    throw new HttpError(403, "You are not in this room.");
  }
  const now = new Date();
  const clocked = applyClock(
    loaded.room,
    loaded.players,
    loaded.secret,
    now,
  );
  let { room, secret } = clocked;
  let players = loaded.players;
  let bump = clocked.changed;
  const command = args.command;

  switch (command.type) {
    case "tick":
      break;
    case "settings": {
      requireHost(me);
      if (room.phase !== "lobby") {
        throw new HttpError(400, "Settings can only change in the lobby.");
      }
      const errors = hardValidateDeck(command.deck, Math.max(players.length, 3));
      if (command.dayTimerSeconds < 30 || command.dayTimerSeconds > 1800) {
        throw new HttpError(400, "Day timer must be between 30 seconds and 30 minutes.");
      }
      if (errors.length && players.length >= 3) {
        throw new HttpError(400, errors[0] ?? "Invalid deck.");
      }
      room = {
        ...room,
        deck: command.deck,
        day_timer_seconds: command.dayTimerSeconds,
      };
      bump = true;
      break;
    }
    case "start": {
      requireHost(me);
      if (room.phase !== "lobby") {
        throw new HttpError(400, "Game already started.");
      }
      if (players.length < 3) {
        throw new HttpError(400, "Need at least 3 players.");
      }
      if (players.length > 10) {
        throw new HttpError(400, "Maximum 10 players.");
      }
      const deck =
        room.deck.length === players.length + 3
          ? room.deck
          : recommendedDeck(players.length);
      const errors = hardValidateDeck(deck, players.length);
      if (errors.length) throw new HttpError(400, errors[0] ?? "Invalid deck.");
      const dealt = createDealtState(toEnginePlayers(players), deck);
      players = players.map((player) => ({ ...player, ready: false }));
      await savePlayersReady(players);
      room = {
        ...room,
        phase: "deal",
        deck,
        round: room.round + 1,
        day_ends_at: null,
      };
      secret = { room_id: room.id, state: dealt, night_advance_at: null };
      bump = true;
      break;
    }
    case "ready": {
      if (room.phase !== "deal") {
        // Late or retried "ready" after the night already began is harmless.
        if (room.phase !== "lobby") break;
        throw new HttpError(400, "You can only ready up after cards are dealt.");
      }
      players = players.map((player) =>
        player.id === me.id ? { ...player, ready: true } : player,
      );
      // Only write this player's flag: writing everyone's from this snapshot
      // could overwrite another player who readied up concurrently.
      await savePlayersReady(players.filter((player) => player.id === me.id));
      bump = true;
      if (players.every((player) => player.ready) && secret) {
        const started = beginDealtNight(room, secret.state, now);
        room = started.room;
        secret = started.secret;
      }
      break;
    }
    case "begin-night": {
      requireHost(me);
      if (room.phase !== "deal" || !secret) {
        throw new HttpError(400, "Night can only start after the deal.");
      }
      const started = beginDealtNight(room, secret.state, now);
      room = started.room;
      secret = started.secret;
      bump = true;
      break;
    }
    case "night-action": {
      if (room.phase !== "night" || !secret) {
        throw new HttpError(400, "It is not night.");
      }
      try {
        const nextState = applyNightAction(secret.state, me.id, command.action);
        const timing = configureNightTiming(nextState, now);
        secret = {
          ...secret,
          state: nextState,
          night_advance_at: timing.nightAdvanceAt,
        };
        if (timing.phase === "day") {
          room = {
            ...room,
            phase: "day",
            day_ends_at: new Date(
              now.getTime() + room.day_timer_seconds * 1000,
            ).toISOString(),
          };
          secret = { ...secret, night_advance_at: null };
        }
        bump = true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Invalid night action.";
        throw new HttpError(400, message);
      }
      break;
    }
    case "dismiss-flash": {
      if (!secret) break;
      secret = {
        ...secret,
        state: {
          ...secret.state,
          flashes: { ...secret.state.flashes, [me.id]: null },
        },
      };
      bump = true;
      break;
    }
    case "start-vote": {
      requireHost(me);
      if (room.phase !== "day") {
        throw new HttpError(400, "Voting starts after the day.");
      }
      room = { ...room, phase: "vote" };
      bump = true;
      break;
    }
    case "vote": {
      if (room.phase !== "vote" || !secret) {
        throw new HttpError(400, "It is not time to vote.");
      }
      const targets = Array.isArray(command.targetPlayerIds)
        ? command.targetPlayerIds
        : [];
      const ballotError = validateBallot(
        me.id,
        targets,
        players.map((player) => player.id),
      );
      if (ballotError) throw new HttpError(400, ballotError);
      if (secret.state.votes[me.id]?.length) {
        throw new HttpError(400, "You already voted.");
      }
      const votes = {
        ...secret.state.votes,
        [me.id]: targets,
      };
      secret = { ...secret, state: { ...secret.state, votes } };
      const everyoneVoted = players.every((player) => votes[player.id]?.length);
      if (everyoneVoted) {
        const resolution = resolveVotes({
          players: toEnginePlayers(players),
          current: secret.state.current,
          doppelgangerCopy: secret.state.doppelgangerCopy,
          votes,
        });
        secret = {
          ...secret,
          state: {
            ...secret.state,
            votes,
            deaths: resolution.deaths,
            winners: resolution.winners,
          },
        };
        room = { ...room, phase: "reveal" };
      }
      bump = true;
      break;
    }
    case "kick": {
      requireHost(me);
      if (room.phase !== "lobby") {
        throw new HttpError(400, "Players can only be kicked in the lobby.");
      }
      if (command.playerId === me.id) {
        throw new HttpError(400, "You cannot kick yourself.");
      }
      const db = supabaseAdmin();
      const { error } = await db
        .from("players")
        .delete()
        .eq("id", command.playerId)
        .eq("room_id", room.id);
      if (error) throw new HttpError(500, error.message);
      players = players.filter((player) => player.id !== command.playerId);
      bump = true;
      break;
    }
    case "restart": {
      requireHost(me);
      const db = supabaseAdmin();
      await db.from("game_secrets").delete().eq("room_id", room.id);
      players = players.map((player) => ({ ...player, ready: false }));
      await savePlayersReady(players);
      room = {
        ...room,
        phase: "lobby",
        day_ends_at: null,
      };
      secret = null;
      bump = true;
      break;
    }
    default: {
      const exhaustive: never = command;
      throw new HttpError(400, `Unknown command ${(exhaustive as Command).type}`);
    }
  }

  if (bump) {
    try {
      room = await persist({
        previous: loaded.room,
        room,
        secret,
        bump: true,
      });
    } catch (error) {
      if (!(error instanceof HttpError) || error.status !== 409) throw error;
      if (command.type === "tick") {
        // A tick only advances clocks; whoever won the race already did that.
        const latest = await loadRoom(args.code);
        return buildView(latest.room, latest.players, latest.secret, me);
      }
      throw new VersionConflict();
    }
  }

  const latestPlayers = (await loadRoom(room.code)).players;
  return buildView(room, latestPlayers, secret, {
    ...me,
    ready: latestPlayers.find((player) => player.id === me.id)?.ready ?? me.ready,
  });
}

