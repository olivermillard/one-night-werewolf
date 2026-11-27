"use client";

import { DealScreen } from "@/components/game/DealScreen";
import { DayScreen } from "@/components/game/DayScreen";
import { LobbyScreen, type LobbySettings } from "@/components/game/LobbyScreen";
import { NightScreen } from "@/components/game/NightScreen";
import { RevealScreen } from "@/components/game/RevealScreen";
import { CardBack } from "@/components/cards/RoleCard";
import { Candle } from "@/components/game/Candle";
import {
  Button,
  ErrorBanner,
  HostResetButton,
  NightProgressBar,
  Shell,
  Title,
  WaitingOnBanner,
} from "@/components/game/ui";
import { VoteScreen } from "@/components/game/VoteScreen";
import { createRoom, fetchView, joinRoom, sendCommand } from "@/lib/client/api";
import { playEndSound, unlockAudio } from "@/lib/client/sound";
import type { Command } from "@/lib/commands";
import { assertNever, type NightAction, type Phase } from "@/lib/game";
import { clearSession, loadSession, saveSession, subscribeSession } from "@/lib/session";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { GameView, SessionPayload } from "@/lib/view";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

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
        if (
          err instanceof Error &&
          /session|Unknown player|Room not found|not in this room/i.test(err.message)
        ) {
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

  // Browsers only allow sound after a tap. On phones only the end of a touch
  // counts (not pointerdown), so listen for those, on every tap: a locked
  // screen can suspend audio again between taps.
  useEffect(() => {
    const unlock = () => unlockAudio();
    const events = ["touchend", "pointerup", "click", "keydown"] as const;
    for (const name of events) window.addEventListener(name, unlock, { passive: true });
    return () => {
      for (const name of events) window.removeEventListener(name, unlock);
    };
  }, []);

  // Play the host's chosen sound on every phone the moment the last vote is
  // in (vote -> reveal). Only on that transition, so reloading the reveal
  // doesn't replay it.
  const phase = view?.room.phase;
  const endSound = view?.room.endSound;
  const previousPhase = useRef(phase);
  useEffect(() => {
    if (previousPhase.current === "vote" && phase === "reveal" && endSound) {
      playEndSound(endSound);
    }
    previousPhase.current = phase;
  }, [phase, endSound]);

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
        <div className="flex flex-1 flex-col items-center justify-center pb-16">
          <Candle className="h-40 w-20" />
          <p className="mt-4 text-center text-lg text-muted">Lighting the candles…</p>
        </div>
      </Shell>
    );
  }

  if (!session || !view) {
    return (
      <Shell>
        <div className="mx-auto mb-6 w-28 -rotate-3">
          <CardBack className="w-full drop-shadow-[0_16px_30px_#000c]" />
        </div>
        <Title kicker="A game for one night">One Night Ultimate Werewolf</Title>
        <p className="-mt-2 mb-8 text-center text-lg leading-relaxed text-muted">
          Gather your village. Each player uses their own phone, and every card stays secret until dawn.
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
            aria-label="Your name"
            className="min-h-13 w-full rounded-lg border border-line bg-panel/80 px-4 text-lg placeholder:text-muted/70 focus:border-gold focus:outline-none"
            maxLength={24}
            required
          />
          {!code ? (
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Room code (to join)"
              aria-label="Room code"
              className="min-h-13 w-full rounded-lg border border-line bg-panel/80 px-4 text-lg uppercase tracking-[0.3em] placeholder:normal-case placeholder:tracking-normal placeholder:text-muted/70 focus:border-gold focus:outline-none"
              maxLength={6}
            />
          ) : (
            <p className="text-center text-muted">Joining room {code.toUpperCase()}</p>
          )}
          <Button type="submit" disabled={busy || name.trim().length < 1}>
            {code || joinCode ? "Join the village" : "Found a new village"}
          </Button>
        </form>
        {!code && joinCode ? (
          <div className="mt-3">
            <Button
              variant="ghost"
              disabled={busy || name.trim().length < 1}
              onClick={() => void handleCreate()}
            >
              Found a new village instead
            </Button>
          </div>
        ) : null}
      </Shell>
    );
  }

  return (
    <Shell>
      <ErrorBanner message={error} />
      {view.waitingOn ? <WaitingOnBanner waiting={view.waitingOn} /> : null}
      <PhaseView
        view={view}
        shareUrl={shareUrl}
        onSettings={(settings) =>
          void act({ type: "settings", ...settings }).catch(() => undefined)
        }
        onStart={(settings) => {
          void (async () => {
            await act({ type: "settings", ...settings });
            await act({ type: "start" });
          })().catch(() => undefined);
        }}
        onKick={(playerId) => void act({ type: "kick", playerId }).catch(() => undefined)}
        onClaim={(slot) => void act({ type: "claim", slot }).catch(() => undefined)}
        onReady={() => void act({ type: "ready" }).catch(() => undefined)}
        onBeginNight={() => void act({ type: "begin-night" }).catch(() => undefined)}
        onAction={(action) => void act({ type: "night-action", action }).catch(() => undefined)}
        onDismissFlash={() => void act({ type: "dismiss-flash" }).catch(() => undefined)}
        onStartVote={() => void act({ type: "start-vote" }).catch(() => undefined)}
        onVote={(targetPlayerIds) => void act({ type: "vote", targetPlayerIds }).catch(() => undefined)}
        onRestart={() => void act({ type: "restart" }).catch(() => undefined)}
      />
      {view.me.isHost && view.room.phase !== "lobby" ? (
        <HostResetButton
          onReset={() => void act({ type: "restart" }).catch(() => undefined)}
        />
      ) : null}
    </Shell>
  );
}

function PhaseView({
  view,
  shareUrl,
  onSettings,
  onStart,
  onKick,
  onClaim,
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
  onSettings: (settings: LobbySettings) => void;
  onStart: (settings: LobbySettings) => void;
  onKick: (playerId: string) => void;
  onClaim: (slot: number) => void;
  onReady: () => void;
  onBeginNight: () => void;
  onAction: (action: NightAction) => void;
  onDismissFlash: () => void;
  onStartVote: () => void;
  onVote: (playerIds: string[]) => void;
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
        <DealScreen
          view={view}
          onClaim={onClaim}
          onReady={onReady}
          onBeginNight={onBeginNight}
        />
      );
    case "night":
      return (
        <>
          {view.night ? (
            <NightProgressBar
              progress={view.night}
              showCaller={!view.private.prompt && !view.private.flash}
            />
          ) : null}
          <NightScreen
            view={view}
            onAction={onAction}
            onDismissFlash={onDismissFlash}
          />
        </>
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
