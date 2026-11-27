import type { SessionPayload } from "@/lib/view";

const KEY = "onuw.session";
const SESSION_EVENT = "onuw-session";

export function loadSession(): SessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionPayload;
    if (!parsed.roomCode || !parsed.playerId || !parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
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
