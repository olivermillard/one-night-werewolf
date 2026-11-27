"use client";

import { DealScreen } from "@/components/game/DealScreen";
import { DayScreen } from "@/components/game/DayScreen";
import { LobbyScreen } from "@/components/game/LobbyScreen";
import { NightScreen } from "@/components/game/NightScreen";
import { RevealScreen } from "@/components/game/RevealScreen";
import { ErrorBanner, Shell } from "@/components/game/ui";
import { VoteScreen } from "@/components/game/VoteScreen";
import { createRoom, fetchView, joinRoom, sendCommand } from "@/lib/client/api";
import type { Command } from "@/lib/commands";
import { assertNever, type NightAction, type Phase, type Role } from "@/lib/game";
import { clearSession, loadSession, saveSession, subscribeSession } from "@/lib/session";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { GameView, SessionPayload } from "@/lib/view";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export function GameApp({ code }: { code?: string }) {
  const stored = useSyncExternalStore(subscribeSession, loadSession, () => null);
  const session =
    stored && (!code || stored.roomCode === code.toUpperCase()) ? stored : null;
  const [view, setView] = useState<GameView | null>(null);
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState(code ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (current: SessionPayload) => {
    const next = await fetchView(current);
    setView(next);
    return next;
  }, []);

  const run = useCallback(
    async (current: SessionPayload, command: Command) => {
      const next = await sendCommand(current, command);
      setView(next);
      return next;
    },
    [],
  );

  useEffect(() => {
    if (!session) {
      return;
    }
    let cancelled = false;
    fetchView(session)
      .then((next) => {
        if (!cancelled) setView(next);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load game.");
        if (err instanceof Error && /session|Unknown player/i.test(err.message)) {
          clearSession();
          setView(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !view) return;
    const phase = view.room.phase;
    const intervalMs = phase === "lobby" ? 2500 : 1000;
    const id = window.setInterval(() => {
      const commandNeeded =
        phase === "night" || phase === "day" || phase === "vote";
      const task = commandNeeded
        ? run(session, { type: "tick" })
        : refresh(session);
      task.catch(() => undefined);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [session, view, refresh, run]);

  const roomId = view?.room.id;
  const roomCode = view?.room.code;
  useEffect(() => {
    if (!roomId || !roomCode) return;
    const client = supabaseBrowser();
    if (!client) return;
    const channel = client
      .channel(`room-${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        () => {
          if (session) refresh(session).catch(() => undefined);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          if (session) refresh(session).catch(() => undefined);
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [roomId, roomCode, session, refresh]);

  const shareUrl = view ? `/r/${view.room.code}` : "";

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const result = await createRoom(name);
      const nextSession = {
        roomCode: result.code,
        playerId: result.playerId,
        token: result.token,
        name,
      };
      saveSession(nextSession);
      setView(result.view);
      window.history.replaceState(null, "", `/r/${result.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create room.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    setBusy(true);
    setError(null);
    try {
      const result = await joinRoom(joinCode || code || "", name);
      const nextSession = {
        roomCode: result.code,
        playerId: result.playerId,
        token: result.token,
        name,
      };
      saveSession(nextSession);
      setView(result.view);
      window.history.replaceState(null, "", `/r/${result.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join.");
    } finally {
      setBusy(false);
    }
  }

  async function act(command: Command) {
    if (!session) throw new Error("No session.");
    setError(null);
    try {
      await run(session, command);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
      throw err;
    }
  }

  if (session && !view) {
    return (
      <Shell>
        <ErrorBanner message={error} />
        <p className="text-muted">Loading the table…</p>
      </Shell>
    );
  }

  if (!session || !view) {
    return (
      <Shell>
        <p className="text-xs uppercase tracking-[0.35em] text-gold">Bezier night, digital table</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl">
          One Night Ultimate Werewolf
        </h1>
        <p className="mt-3 mb-6 text-muted">
          Each player uses their own phone. Cards stay secret unless the rules let you see them.
        </p>
        <ErrorBanner message={error} />
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (code || joinCode) void handleJoin();
            else void handleCreate();
          }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            autoComplete="nickname"
            className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4"
            maxLength={24}
            required
          />
          {!code ? (
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Room code (to join)"
              className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 uppercase tracking-[0.3em]"
              maxLength={6}
            />
          ) : (
            <p className="text-sm text-muted">Joining room {code.toUpperCase()}</p>
          )}
          <button
            type="submit"
            disabled={busy || name.trim().length < 1}
            className="min-h-12 w-full rounded-2xl bg-gold text-base font-semibold text-black disabled:opacity-40"
          >
            {code || joinCode ? "Join room" : "Create room"}
          </button>
        </form>
        {!code ? (
          <button
            type="button"
            disabled={busy || name.trim().length < 1}
            onClick={() => void handleCreate()}
            className="mt-3 min-h-12 w-full rounded-2xl border border-white/15 text-base"
          >
            Create a new room
          </button>
        ) : null}
      </Shell>
    );
  }

  return (
    <Shell>
      <ErrorBanner message={error} />
      <PhaseView
        view={view}
        shareUrl={shareUrl}
        onSettings={(deck, dayTimerSeconds) =>
          void act({ type: "settings", deck, dayTimerSeconds }).catch(() => undefined)
        }
        onStart={(deck, dayTimerSeconds) => {
          void (async () => {
            await act({ type: "settings", deck, dayTimerSeconds });
            await act({ type: "start" });
          })().catch(() => undefined);
        }}
        onKick={(playerId) => void act({ type: "kick", playerId }).catch(() => undefined)}
        onReady={() => void act({ type: "ready" }).catch(() => undefined)}
        onBeginNight={() => void act({ type: "begin-night" }).catch(() => undefined)}
        onAction={(action) => void act({ type: "night-action", action }).catch(() => undefined)}
        onDismissFlash={() => void act({ type: "dismiss-flash" }).catch(() => undefined)}
        onStartVote={() => void act({ type: "start-vote" }).catch(() => undefined)}
        onVote={(targetPlayerId) => void act({ type: "vote", targetPlayerId }).catch(() => undefined)}
        onRestart={() => void act({ type: "restart" }).catch(() => undefined)}
      />
    </Shell>
  );
}

function PhaseView({
  view,
  shareUrl,
  onSettings,
  onStart,
  onKick,
  onReady,
  onBeginNight,
  onAction,
  onDismissFlash,
  onStartVote,
  onVote,
  onRestart,
}: {
  view: GameView;
  shareUrl: string;
  onSettings: (deck: Role[], dayTimerSeconds: number) => void;
  onStart: (deck: Role[], dayTimerSeconds: number) => void;
  onKick: (playerId: string) => void;
  onReady: () => void;
  onBeginNight: () => void;
  onAction: (action: NightAction) => void;
  onDismissFlash: () => void;
  onStartVote: () => void;
  onVote: (playerId: string) => void;
  onRestart: () => void;
}) {
  const phase: Phase = view.room.phase;
  switch (phase) {
    case "lobby":
      return (
        <LobbyScreen
          view={view}
          shareUrl={shareUrl}
          onSettings={onSettings}
          onStart={onStart}
          onKick={onKick}
        />
      );
    case "deal":
      return (
        <DealScreen view={view} onReady={onReady} onBeginNight={onBeginNight} />
      );
    case "night":
      return (
        <NightScreen
          view={view}
          onAction={onAction}
          onDismissFlash={onDismissFlash}
        />
      );
    case "day":
      return <DayScreen view={view} onStartVote={onStartVote} />;
    case "vote":
      return <VoteScreen view={view} onVote={onVote} />;
    case "reveal":
      return <RevealScreen view={view} onRestart={onRestart} />;
    default:
      return assertNever(phase);
  }
}
