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
import { playEndSound, unlockAudio } from "@/lib/client/sound";
import { END_SOUND_OPTIONS, type EndSoundId } from "@/lib/settings";
import type { GameView } from "@/lib/view";

export interface LobbySettings {
  deck: Role[];
  dayTimerSeconds: number;
  allWerewolvesMustDie: boolean;
  endSound: EndSoundId;
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
  const endSound = view.room.endSound;
  const settings = (overrides: Partial<LobbySettings> = {}): LobbySettings => ({
    deck,
    dayTimerSeconds: timer,
    allWerewolvesMustDie: allWolves,
    endSound,
    ...overrides,
  });
  const [copied, setCopied] = useState(false);
  const playerCount = view.room.players.length;
  const needed = requiredCardCount(Math.max(playerCount, 3));
  const errors = hardValidateDeck(deck, playerCount);
  const counts = useMemo(() => countRoles(deck), [deck]);

  /** Tap a card: add a copy; once it's full (or the deck is), go back to none. */
  function cycle(role: Role) {
    const used = counts[role];
    if (used < ROLE_COPIES[role] && deck.length < 13) {
      setDeck([...deck, role]);
    } else {
      setDeck(deck.filter((item) => item !== role));
    }
  }

  function removeOne(role: Role) {
    const index = deck.lastIndexOf(role);
    if (index !== -1) setDeck(deck.filter((_, i) => i !== index));
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
          Tap a card to add a copy; tapping a full card clears it. Use − to remove one.{" "}
          <button type="button" className="text-gold underline underline-offset-4" onClick={applyPreset}>
            Use recommended
          </button>
        </p>
      ) : null}
      <div className="grid grid-cols-3 gap-3">
        {rolesInWakeOrder.map((role) => {
          const used = counts[role];
          return (
            <div key={role} className="relative">
              <button
                type="button"
                disabled={!view.me.isHost}
                onClick={() => cycle(role)}
                aria-label={`${ROLE_INFO[role].name}: ${used} of ${ROLE_COPIES[role]} in play. Tap to add one.`}
                className={`relative block w-full text-left transition-[opacity,filter,transform] duration-150 active:scale-[0.97] disabled:active:scale-100 ${
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
              {/* Roles with several copies get a − so you can step back down. */}
              {view.me.isHost && ROLE_COPIES[role] > 1 && used > 0 ? (
                <button
                  type="button"
                  onClick={() => removeOne(role)}
                  aria-label={`Remove one ${ROLE_INFO[role].name}`}
                  className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#f0d89a] bg-[#120d0a]/90 text-lg leading-none text-gold active:scale-95"
                >
                  −
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <SectionHeading>Host settings</SectionHeading>
      <Panel>
        <div className="space-y-6">
          <fieldset>
            <legend className="font-[family-name:var(--font-display)] text-xl text-[#f3e6c8]">
              For the village to win
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="For the village to win">
              {[
                { value: false, title: "One Werewolf", detail: "dies (official)" },
                { value: true, title: "Every Werewolf", detail: "must die" },
              ].map((option) => {
                const selected = allWolves === option.value;
                return (
                  <button
                    key={option.title}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={!view.me.isHost}
                    onClick={() => onSettings(settings({ allWerewolvesMustDie: option.value }))}
                    className={`min-h-14 rounded-lg border px-3 py-2 text-left transition-colors duration-150 ${
                      selected
                        ? "border-[#f0d89a] bg-gold text-[#1c120a]"
                        : "border-line bg-[#120d0a]/60 text-foreground disabled:opacity-50"
                    }`}
                  >
                    <span className="block text-lg leading-tight">{option.title}</span>
                    <span className={`block text-sm ${selected ? "text-[#3a2a14]" : "text-muted"}`}>
                      {option.detail}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-[family-name:var(--font-display)] text-xl text-[#f3e6c8]">
              Sound when the votes are in
            </legend>
            <p className="mt-0.5 text-sm text-muted">Plays on every phone. Tap ▶ to preview.</p>
            <ul className="mt-2 space-y-2" role="radiogroup" aria-label="Sound when the votes are in">
              {END_SOUND_OPTIONS.map((option) => {
                const selected = endSound === option.id;
                return (
                  <li key={option.id} className="flex gap-2">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={!view.me.isHost}
                      onClick={() => onSettings(settings({ endSound: option.id }))}
                      className={`min-h-12 flex-1 rounded-lg border px-4 text-left text-lg transition-colors duration-150 ${
                        selected
                          ? "border-[#f0d89a] bg-gold text-[#1c120a]"
                          : "border-line bg-[#120d0a]/60 text-foreground disabled:opacity-50"
                      }`}
                    >
                      {option.label}
                    </button>
                    {option.id !== "none" ? (
                      <button
                        type="button"
                        aria-label={`Preview ${option.label}`}
                        onClick={() => {
                          unlockAudio();
                          playEndSound(option.id);
                        }}
                        className="min-h-12 w-12 shrink-0 rounded-lg border border-line bg-[#120d0a]/60 text-gold active:bg-panel-raised"
                      >
                        ▶
                      </button>
                    ) : (
                      <span className="w-12 shrink-0" />
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>
          {view.me.isHost ? null : (
            <p className="text-center text-sm text-muted">Only the host can change these.</p>
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
