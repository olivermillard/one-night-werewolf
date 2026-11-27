import { MiniRole } from "@/components/cards/RoleCard";
import { Button, Panel, SectionHeading, Title } from "@/components/game/ui";
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

export interface LobbySettings {
  deck: Role[];
  dayTimerSeconds: number;
  allWerewolvesMustDie: boolean;
}
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
  onSettings: (settings: LobbySettings) => void;
  onStart: (settings: LobbySettings) => void;
  onKick: (playerId: string) => void;
}) {
  const [deck, setDeck] = useState<Role[]>(view.room.deck);
  const [timer, setTimer] = useState(view.room.dayTimerSeconds);
  const allWolves = view.room.houseRules.allWerewolvesMustDie;
  const settings = (overrides: Partial<LobbySettings> = {}): LobbySettings => ({
    deck,
    dayTimerSeconds: timer,
    allWerewolvesMustDie: allWolves,
    ...overrides,
  });
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
    onSettings(settings({ deck: next }));
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

  const rolesInWakeOrder = [...ROLES].sort(
    (a, b) => (ROLE_INFO[a].nightOrder ?? 99) - (ROLE_INFO[b].nightOrder ?? 99),
  );

  return (
    <>
      <Title kicker="The village gathers">Room {view.room.code}</Title>
      <Panel className="text-center">
        <p className="text-muted">Share the code or link. Everyone plays on their own phone.</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-5xl tracking-[0.2em] text-gold">
          {view.room.code}
        </p>
        <div className="mt-4">
          <Button onClick={copyLink} variant="ghost">
            {copied ? "Link copied" : "Copy invite link"}
          </Button>
        </div>
      </Panel>

      <SectionHeading>Villagers ({playerCount})</SectionHeading>
      <ul className="space-y-2">
        {view.room.players.map((player) => (
          <li
            key={player.id}
            className="flex min-h-13 items-center justify-between rounded-lg border border-line bg-panel/80 px-4"
          >
            <span className="text-lg">
              {player.name}
              {player.isHost ? <span className="small-caps ml-2 text-sm text-gold">host</span> : null}
              {player.id === view.me.id ? <span className="small-caps ml-2 text-sm text-muted">you</span> : null}
            </span>
            {view.me.isHost && !player.isHost ? (
              <button
                type="button"
                className="small-caps min-h-11 px-2 text-[#e08a78]"
                onClick={() => onKick(player.id)}
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>

      <SectionHeading>
        Cards in play ({deck.length}/{needed})
      </SectionHeading>
      {view.me.isHost ? (
        <p className="-mt-1 mb-3 text-center text-sm text-muted">
          Tap a card to add a copy, tap a full card to remove one.{" "}
          <button type="button" className="text-gold underline underline-offset-4" onClick={applyPreset}>
            Use recommended
          </button>
        </p>
      ) : null}
      <div className="grid grid-cols-3 gap-3">
        {rolesInWakeOrder.map((role) => {
          const used = counts[role];
          return (
            <button
              key={role}
              type="button"
              disabled={!view.me.isHost}
              onClick={() => toggle(role)}
              aria-label={`${ROLE_INFO[role].name}: ${used} of ${ROLE_COPIES[role]} in play`}
              className={`relative text-left transition-[opacity,filter,transform] duration-150 active:scale-[0.97] disabled:active:scale-100 ${
                used ? "" : "opacity-45 grayscale-[60%]"
              }`}
            >
              <MiniRole role={role} />
              <span
                className={`absolute right-1 top-1 min-w-7 rounded-full border px-1.5 text-center font-[family-name:var(--font-display)] text-sm ${
                  used
                    ? "border-[#f0d89a] bg-gold text-[#1c120a]"
                    : "border-line bg-panel text-muted"
                }`}
              >
                {used}/{ROLE_COPIES[role]}
              </span>
            </button>
          );
        })}
      </div>

      <SectionHeading>House rules</SectionHeading>
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl text-[#f3e6c8]">
              Every Werewolf must die
            </p>
            <p className="mt-1 leading-snug text-muted">
              {allWolves
                ? "The village wins only if every Werewolf held by a player dies."
                : "Official rule: the village wins if at least one Werewolf dies."}
            </p>
          </div>
          {view.me.isHost ? (
            <button
              type="button"
              role="switch"
              aria-checked={allWolves}
              aria-label="Every Werewolf must die"
              onClick={() => onSettings(settings({ allWerewolvesMustDie: !allWolves }))}
              className={`relative mt-1 h-8 w-14 shrink-0 rounded-full border transition-colors duration-200 ${
                allWolves ? "border-[#f0d89a] bg-gold-deep" : "border-line bg-[#120d0a]"
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-[1.375rem] w-[1.375rem] rounded-full shadow transition-transform duration-200 ${
                  allWolves ? "translate-x-6 bg-[#f3e6c8]" : "translate-x-0 bg-muted"
                }`}
              />
            </button>
          ) : (
            <span className="small-caps mt-1 shrink-0 tracking-[0.15em] text-gold">
              {allWolves ? "On" : "Off"}
            </span>
          )}
        </div>
      </Panel>

      {view.me.isHost ? (
        <section className="mt-8 space-y-4">
          <label className="block">
            <span className="small-caps tracking-[0.2em] text-gold">
              Day lasts {Math.round(timer / 60)} min
            </span>
            <input
              type="range"
              min={60}
              max={900}
              step={30}
              value={timer}
              onChange={(event) => setTimer(Number(event.target.value))}
              className="mt-2 w-full accent-[#d4a85a]"
            />
          </label>
          <Button onClick={() => onSettings(settings())} variant="ghost">
            Save setup
          </Button>
          {errors.map((error) => (
            <p key={error} className="text-center text-[#e08a78]">
              {error}
            </p>
          ))}
          <Button
            onClick={() => onStart(settings())}
            disabled={playerCount < 3 || errors.length > 0}
          >
            Deal the cards
          </Button>
        </section>
      ) : (
        <p className="mt-8 text-center text-muted">Waiting for the host to deal.</p>
      )}
    </>
  );
}
