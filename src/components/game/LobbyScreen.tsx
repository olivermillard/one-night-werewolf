import { MiniRole } from "@/components/cards/RoleCard";
import { Button, Panel, Title } from "@/components/game/ui";
import {
  ROLE_COPIES,
  ROLE_INFO,
  ROLES,
  countRoles,
  hardValidateDeck,
  recommendedDeck,
  requiredCardCount,
  type Role,
} from "@/lib/game";
import type { GameView } from "@/lib/view";
import { useMemo, useState } from "react";

export function LobbyScreen({
  view,
  shareUrl,
  onSettings,
  onStart,
  onKick,
}: {
  view: GameView;
  shareUrl: string;
  onSettings: (deck: Role[], dayTimerSeconds: number) => void;
  onStart: (deck: Role[], dayTimerSeconds: number) => void;
  onKick: (playerId: string) => void;
}) {
  const [deck, setDeck] = useState<Role[]>(view.room.deck);
  const [timer, setTimer] = useState(view.room.dayTimerSeconds);
  const [copied, setCopied] = useState(false);
  const playerCount = view.room.players.length;
  const needed = requiredCardCount(Math.max(playerCount, 3));
  const errors = hardValidateDeck(deck, playerCount);
  const counts = useMemo(() => countRoles(deck), [deck]);

  function toggle(role: Role) {
    const used = counts[role];
    if (used < ROLE_COPIES[role] && deck.length < 13) {
      setDeck([...deck, role]);
    } else if (used > 0) {
      const index = deck.lastIndexOf(role);
      setDeck(deck.filter((_, i) => i !== index));
    }
  }

  function applyPreset() {
    const next = recommendedDeck(Math.max(playerCount, 3));
    setDeck(next);
    onSettings(next, timer);
  }

  async function copyLink() {
    const url =
      shareUrl.startsWith("http")
        ? shareUrl
        : `${window.location.origin}${shareUrl}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <>
      <Title kicker="Lobby">{view.room.code}</Title>
      <Panel>
        <p className="text-sm text-muted">Share this code or link. Everyone plays on their own phone.</p>
        <div className="mt-3 flex gap-2">
          <Button onClick={copyLink} variant="ghost">
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </Panel>

      <section className="mt-5">
        <h2 className="mb-2 text-sm uppercase tracking-[0.2em] text-muted">Players</h2>
        <ul className="space-y-2">
          {view.room.players.map((player) => (
            <li
              key={player.id}
              className="flex min-h-12 items-center justify-between rounded-2xl bg-white/5 px-4"
            >
              <span>
                {player.name}
                {player.isHost ? " · Host" : ""}
                {player.id === view.me.id ? " · You" : ""}
              </span>
              {view.me.isHost && !player.isHost ? (
                <button
                  type="button"
                  className="text-sm text-red-300"
                  onClick={() => onKick(player.id)}
                >
                  Kick
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm uppercase tracking-[0.2em] text-muted">
            Roles ({deck.length}/{needed})
          </h2>
          {view.me.isHost ? (
            <button type="button" className="text-sm text-gold" onClick={applyPreset}>
              Recommended
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((role) => {
            const used = counts[role];
            return (
              <button
                key={role}
                type="button"
                disabled={!view.me.isHost}
                onClick={() => toggle(role)}
                className={`rounded-2xl border px-3 py-3 text-left ${
                  used ? "border-gold/50 bg-gold/10" : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <MiniRole role={role} />
                  <span className="text-sm text-muted">
                    {used}/{ROLE_COPIES[role]}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted">{ROLE_INFO[role].blurb}</p>
              </button>
            );
          })}
        </div>
      </section>

      {view.me.isHost ? (
        <section className="mt-6 space-y-3">
          <label className="block text-sm text-muted">
            Day timer: {Math.round(timer / 60)} min
            <input
              type="range"
              min={60}
              max={900}
              step={30}
              value={timer}
              onChange={(event) => setTimer(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
          <Button onClick={() => onSettings(deck, timer)} variant="ghost">
            Save setup
          </Button>
          {errors.map((error) => (
            <p key={error} className="text-sm text-red-300">
              {error}
            </p>
          ))}
          <Button
            onClick={() => onStart(deck, timer)}
            disabled={playerCount < 3 || errors.length > 0}
          >
            Deal cards
          </Button>
        </section>
      ) : (
        <p className="mt-6 text-center text-muted">Waiting for the host to deal.</p>
      )}
    </>
  );
}
