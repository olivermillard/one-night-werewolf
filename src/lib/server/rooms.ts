import { recommendedDeck } from "@/lib/game";
import {
  createPlayerToken,
  hashToken,
  randomRoomCode,
} from "@/lib/server/auth";
import { getView } from "@/lib/server/game-service";
import { HttpError } from "@/lib/server/http";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { GameView } from "@/lib/view";

function normalizeName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 1 || trimmed.length > 24) {
    throw new HttpError(400, "Name must be 1–24 characters.");
  }
  return trimmed;
}

export async function createRoom(rawName: string): Promise<{
  view: GameView;
  token: string;
  playerId: string;
  code: string;
}> {
  const name = normalizeName(rawName);
  const db = supabaseAdmin();
  const token = createPlayerToken();
  const tokenHash = hashToken(token);

  let code = randomRoomCode();
  let roomId: string | null = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await db
      .from("rooms")
      .insert({
        code,
        phase: "lobby",
        deck: recommendedDeck(3),
        day_timer_seconds: 300,
      })
      .select("id, code")
      .maybeSingle();
    if (!error && data) {
      roomId = String(data.id);
      code = String(data.code);
      break;
    }
    if (error && error.code === "23505") {
      code = randomRoomCode();
      continue;
    }
    if (error) throw new HttpError(500, error.message);
  }
  if (!roomId) throw new HttpError(500, "Could not create a room code.");

  const { data: player, error: playerError } = await db
    .from("players")
    .insert({
      room_id: roomId,
      name,
      is_host: true,
      ready: false,
      seat: 0,
    })
    .select("id")
    .single();
  if (playerError || !player) {
    await db.from("rooms").delete().eq("id", roomId);
    throw new HttpError(500, playerError?.message ?? "Could not create host.");
  }

  const playerId = String(player.id);
  const { error: authError } = await db.from("player_auth").insert({
    player_id: playerId,
    token_hash: tokenHash,
  });
  if (authError) {
    await db.from("rooms").delete().eq("id", roomId);
    throw new HttpError(500, authError.message);
  }

  const { error: hostError } = await db
    .from("rooms")
    .update({ host_player_id: playerId })
    .eq("id", roomId);
  if (hostError) throw new HttpError(500, hostError.message);

  const view = await getView({ code, playerId, token });
  return { view, token, playerId, code };
}

export async function joinRoom(
  rawCode: string,
  rawName: string,
): Promise<{
  view: GameView;
  token: string;
  playerId: string;
  code: string;
}> {
  const name = normalizeName(rawName);
  const code = rawCode.trim().toUpperCase();
  const db = supabaseAdmin();
  const { data: room, error: roomError } = await db
    .from("rooms")
    .select("id, phase")
    .eq("code", code)
    .maybeSingle();
  if (roomError) throw new HttpError(500, roomError.message);
  if (!room) throw new HttpError(404, "Room not found.");
  if (String(room.phase) !== "lobby") {
    throw new HttpError(400, "This game already started.");
  }

  const { data: existing, error: existingError } = await db
    .from("players")
    .select("id, seat")
    .eq("room_id", room.id);
  if (existingError) throw new HttpError(500, existingError.message);
  if ((existing ?? []).length >= 10) {
    throw new HttpError(400, "This room is full.");
  }
  const seat =
    Math.max(0, ...(existing ?? []).map((row) => Number(row.seat))) + 1;

  const token = createPlayerToken();
  const { data: player, error: playerError } = await db
    .from("players")
    .insert({
      room_id: room.id,
      name,
      is_host: false,
      ready: false,
      seat,
    })
    .select("id")
    .single();
  if (playerError || !player) {
    throw new HttpError(500, playerError?.message ?? "Could not join.");
  }
  const playerId = String(player.id);
  const { error: authError } = await db.from("player_auth").insert({
    player_id: playerId,
    token_hash: hashToken(token),
  });
  if (authError) {
    await db.from("players").delete().eq("id", playerId);
    throw new HttpError(500, authError.message);
  }

  const { data: current } = await db
    .from("rooms")
    .select("view_version")
    .eq("id", room.id)
    .single();
  await db
    .from("rooms")
    .update({ view_version: Number(current?.view_version ?? 0) + 1 })
    .eq("id", room.id);

  const view = await getView({ code, playerId, token });
  return { view, token, playerId, code };
}
