import type { Command } from "@/lib/commands";
import type { GameView, SessionPayload } from "@/lib/view";

async function parseError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function api<T>(
  path: string,
  session: SessionPayload | null,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (session) {
    headers.set("authorization", `Bearer ${session.token}`);
    headers.set("x-player-id", session.playerId);
  }
  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as T;
}

export function createRoom(name: string) {
  return api<{
    view: GameView;
    token: string;
    playerId: string;
    code: string;
  }>("/api/rooms", null, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function joinRoom(code: string, name: string) {
  return api<{
    view: GameView;
    token: string;
    playerId: string;
    code: string;
  }>(`/api/rooms/${code}/join`, null, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function fetchView(session: SessionPayload) {
  return api<GameView>(`/api/rooms/${session.roomCode}/view`, session);
}

export function sendCommand(session: SessionPayload, command: Command) {
  return api<GameView>(`/api/rooms/${session.roomCode}/command`, session, {
    method: "POST",
    body: JSON.stringify(command),
  });
}
