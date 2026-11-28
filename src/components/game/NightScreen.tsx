import { CardBack, MiniRole } from "@/components/cards/RoleCard";
import { Moon, moonForStep } from "@/components/game/Moon";
import { Button, Title } from "@/components/game/ui";
import {
  CENTER_LABELS,
  MESSAGE_MAX_LENGTH,
  assertNever,
  type NightAction,
  type NightPrompt,
} from "@/lib/game";
import type { GameView, PublicPlayer } from "@/lib/view";
import { useState } from "react";

export function NightScreen({
  view,
  onAction,
  onDismissFlash,
}: {
  view: GameView;
  onAction: (action: NightAction) => void;
  onDismissFlash: () => void;
}) {
  const prompt = view.private.prompt;
  const flash = view.private.flash;

  if (flash && !prompt) {
    return (
      <>
        <Title kicker="Night">{flash.title}</Title>
        <p className="mb-5 text-center text-lg">{flash.body}</p>
        <div className="mb-8 flex flex-wrap justify-center gap-3">
          {flash.roles.map((role, index) => (
            <div key={`${role}-${index}`} className="w-32">
              <MiniRole role={role} />
            </div>
          ))}
        </div>
        <Button onClick={onDismissFlash}>Close your eyes</Button>
      </>
    );
  }

  if (!prompt) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Moon
          lit={view.night ? moonForStep(view.night.current, view.night.steps.length) : 0.5}
          glow
          className="candle-pulse mb-6 h-32 w-32"
        />
        <Title kicker="Night">Eyes closed</Title>
        <p className="text-lg text-muted">Stay quiet. Your screen will change when it is your turn.</p>
      </div>
    );
  }

  return (
    <>
      <Title kicker="Night">{prompt.title}</Title>
      <p className="mb-6 text-center text-lg leading-relaxed">{prompt.instruction}</p>
      <NightPromptForm
        key={`${prompt.kind}:${prompt.title}`}
        prompt={prompt}
        players={view.room.players}
        onAction={onAction}
      />
    </>
  );
}

function NightPromptForm({
  prompt,
  players,
  onAction,
}: {
  prompt: NightPrompt;
  players: PublicPlayer[];
  onAction: (action: NightAction) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [center, setCenter] = useState<number[]>([]);
  const [note, setNote] = useState("");
  const named = (id: string) =>
    players.find((player) => player.id === id)?.name ?? id;

  switch (prompt.kind) {
    case "acknowledge":
      return (
        <div className="space-y-4">
          {prompt.seenPlayerIds.length ? (
            <ul className="space-y-2">
              {prompt.seenPlayerIds.map((id) => (
                <li key={id} className="rounded-lg border border-line bg-panel/80 px-4 py-3 text-lg">
                  {named(id)}
                </li>
              ))}
            </ul>
          ) : null}
          {prompt.seenRoles.length || prompt.ownRole ? (
            <div className="flex flex-wrap justify-center gap-3">
              {prompt.seenRoles.map((role, index) => (
                <div key={`${role}-${index}`} className="w-28">
                  <MiniRole role={role} />
                </div>
              ))}
              {prompt.ownRole && !prompt.seenRoles.includes(prompt.ownRole) ? (
                <div className="w-28">
                  <MiniRole role={prompt.ownRole} caption="You" />
                </div>
              ) : null}
            </div>
          ) : null}
          <Button onClick={() => onAction({ kind: "acknowledge" })}>Close your eyes</Button>
        </div>
      );
    case "doppelganger_copy":
    case "robber":
      return (
        <Chooser
          players={prompt.playerIds.map((id) => ({
            id,
            name: named(id),
          }))}
          selected={selected}
          onToggle={(id) => setSelected([id])}
          skip={
            prompt.canSkip
              ? () =>
                  onAction(
                    prompt.kind === "robber"
                      ? { kind: "robber_skip" }
                      : { kind: "acknowledge" },
                  )
              : undefined
          }
          confirm={() => {
            const target = selected[0];
            if (!target) return;
            onAction(
              prompt.kind === "robber"
                ? { kind: "robber", targetPlayerId: target }
                : { kind: "doppelganger_copy", targetPlayerId: target },
            );
          }}
        />
      );
    case "seer":
      return (
        <div className="space-y-4">
          <p className="text-center text-muted">Pick one player, or two center cards.</p>
          <Chooser
            players={prompt.playerIds.map((id) => ({
              id,
              name: named(id),
            }))}
            selected={selected}
            onToggle={(id) => {
              setCenter([]);
              setSelected([id]);
            }}
          />
          <CenterChooser
            selected={center}
            max={2}
            onToggle={(index) => {
              setSelected([]);
              setCenter((current) => toggleIndex(current, index, 2));
            }}
          />
          <Button
            disabled={selected.length !== 1 && center.length !== 2}
            onClick={() => {
              if (selected[0]) {
                onAction({ kind: "seer_player", targetPlayerId: selected[0] });
              } else if (center.length === 2 && center[0] !== undefined && center[1] !== undefined) {
                onAction({
                  kind: "seer_center",
                  centerIndexes: [center[0], center[1]],
                });
              }
            }}
          >
            Look
          </Button>
          <Button variant="ghost" onClick={() => onAction({ kind: "seer_skip" })}>
            Skip
          </Button>
        </div>
      );
    case "troublemaker":
      return (
        <Chooser
          players={prompt.playerIds.map((id) => ({
            id,
            name: named(id),
          }))}
          selected={selected}
          onToggle={(id) =>
            setSelected((current) => toggleId(current, id, 2))
          }
          skip={() => onAction({ kind: "troublemaker_skip" })}
          confirmLabel="Swap those two"
          confirm={() => {
            if (selected.length !== 2 || !selected[0] || !selected[1]) return;
            onAction({
              kind: "troublemaker",
              playerAId: selected[0],
              playerBId: selected[1],
            });
          }}
          disabled={selected.length !== 2}
        />
      );
    case "herbalist":
      return (
        <div className="space-y-4">
          <p className="text-center text-muted">Pick one player and one center card.</p>
          <Chooser
            players={prompt.playerIds.map((id) => ({ id, name: named(id) }))}
            selected={selected}
            onToggle={(id) => setSelected([id])}
          />
          <CenterChooser
            selected={center}
            max={1}
            onToggle={(index) => setCenter([index])}
          />
          <Button
            disabled={!selected[0] || center[0] === undefined}
            onClick={() => {
              const target = selected[0];
              const index = center[0];
              if (!target || index === undefined) return;
              onAction({ kind: "herbalist", targetPlayerId: target, centerIndex: index });
            }}
          >
            Swap unseen
          </Button>
          <Button variant="ghost" onClick={() => onAction({ kind: "herbalist_skip" })}>
            Skip
          </Button>
        </div>
      );
    case "messenger": {
      const trimmed = note.trim();
      return (
        <div className="space-y-4">
          <Chooser
            players={prompt.playerIds.map((id) => ({ id, name: named(id) }))}
            selected={selected}
            onToggle={(id) => setSelected([id])}
          />
          <label className="block">
            <span className="small-caps mb-2 block text-center text-sm tracking-[0.2em] text-muted">
              Your note · unsigned
            </span>
            <textarea
              value={note}
              maxLength={MESSAGE_MAX_LENGTH}
              rows={3}
              onChange={(event) => setNote(event.target.value.replace(/\n/g, " "))}
              placeholder="Trust no one who claims the Robber…"
              className="w-full resize-none rounded-lg border border-line bg-panel/80 px-4 py-3 text-lg text-[#f3e6c8] placeholder:text-muted/60 focus:border-gold focus:outline-none"
            />
            <span className="mt-1 block text-right text-sm text-muted">
              {note.length}/{MESSAGE_MAX_LENGTH}
            </span>
          </label>
          <Button
            disabled={!selected[0] || !trimmed}
            onClick={() => {
              const target = selected[0];
              if (!target || !trimmed) return;
              onAction({ kind: "messenger", targetPlayerId: target, text: trimmed });
            }}
          >
            {selected[0] ? `Send to ${named(selected[0])}` : "Pick who gets it"}
          </Button>
          <Button variant="ghost" onClick={() => onAction({ kind: "messenger_skip" })}>
            Skip
          </Button>
        </div>
      );
    }
    case "drunk":
    case "werewolf_lone":
      return (
        <div className="space-y-4">
          <CenterChooser
            selected={center}
            max={1}
            onToggle={(index) => setCenter([index])}
          />
          <Button
            disabled={center[0] === undefined}
            onClick={() => {
              const index = center[0];
              if (index === undefined) return;
              onAction(
                prompt.kind === "drunk"
                  ? { kind: "drunk", centerIndex: index }
                  : { kind: "werewolf_lone", centerIndex: index },
              );
            }}
          >
            {prompt.kind === "drunk" ? "Swap unseen" : "Look"}
          </Button>
          {prompt.canSkip ? (
            <Button
              variant="ghost"
              onClick={() =>
                onAction(
                  prompt.kind === "werewolf_lone"
                    ? { kind: "werewolf_lone_skip" }
                    : { kind: "acknowledge" },
                )
              }
            >
              Skip
            </Button>
          ) : null}
        </div>
      );
    default:
      return assertNever(prompt.kind);
  }
}

function toggleId(current: string[], id: string, max: number): string[] {
  if (current.includes(id)) return current.filter((item) => item !== id);
  if (current.length >= max) return [...current.slice(1), id];
  return [...current, id];
}

function toggleIndex(current: number[], index: number, max: number): number[] {
  if (current.includes(index)) return current.filter((item) => item !== index);
  if (current.length >= max) return [...current.slice(1), index];
  return [...current, index];
}

function Chooser({
  players,
  selected,
  onToggle,
  confirm,
  skip,
  confirmLabel = "Confirm",
  disabled,
}: {
  players: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  confirm?: () => void;
  skip?: () => void;
  confirmLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      {players.map((player) => (
        <button
          key={player.id}
          type="button"
          onClick={() => onToggle(player.id)}
          aria-pressed={selected.includes(player.id)}
          className={`min-h-13 w-full rounded-lg border px-4 text-left text-lg transition-colors duration-150 ${
            selected.includes(player.id)
              ? "border-[#f0d89a] bg-gold text-[#1c120a]"
              : "border-line bg-panel/80"
          }`}
        >
          {player.name}
        </button>
      ))}
      {confirm ? (
        <Button onClick={confirm} disabled={disabled ?? selected.length === 0}>
          {confirmLabel}
        </Button>
      ) : null}
      {skip ? (
        <Button variant="ghost" onClick={skip}>
          Skip
        </Button>
      ) : null}
    </div>
  );
}

function CenterChooser({
  selected,
  max,
  onToggle,
}: {
  selected: number[];
  max: number;
  onToggle: (index: number) => void;
}) {
  return (
    <div>
      <p className="small-caps mb-2 text-center text-sm tracking-[0.2em] text-muted">
        Center cards · pick {max}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {CENTER_LABELS.map((label, index) => {
          const isSelected = selected.includes(index);
          return (
            <button
              key={label}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(index)}
              className={`rounded-xl p-1 transition-transform duration-150 ${
                isSelected
                  ? "-translate-y-1.5 ring-2 ring-gold shadow-[0_0_24px_#e0b45c66]"
                  : ""
              }`}
            >
              <CardBack className="w-full" />
              <span className="small-caps mt-1 block text-center tracking-[0.15em] text-muted">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
