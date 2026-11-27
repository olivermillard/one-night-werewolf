import type { SessionPayload } from "@/lib/view";

const KEY = "onuw.session";
const SESSION_EVENT = "onuw-session";

// useSyncExternalStore requires getSnapshot to return the same reference
// while the store is unchanged, so cache the parsed value by its raw string.
let cachedRaw: string | null = null;
let cachedSession: SessionPayload | null = null;

function parseSession(raw: string | null): SessionPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionPayload;
    if (!parsed.roomCode || !parsed.playerId || !parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function loadSession(): SessionPayload | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSession = parseSession(raw);
  }
  return cachedSession;
}

export function saveSession(session: SessionPayload): void {
  window.localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function clearSession(): void {
  window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function subscribeSession(onStoreChange: () => void): () => void {
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(SESSION_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(SESSION_EVENT, handler);
  };
}
