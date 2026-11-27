import { MiniRole } from "@/components/cards/RoleCard";
import { Button, Title } from "@/components/game/ui";
import {
  CENTER_LABELS,
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
        <p className="mb-4 text-lg">{flash.body}</p>
        <div className="mb-6 flex flex-wrap gap-2">
          {flash.roles.map((role, index) => (
            <MiniRole key={`${role}-${index}`} role={role} />
          ))}
        </div>
        <Button onClick={onDismissFlash}>Close your eyes</Button>
      </>
    );
  }

  if (!prompt) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-6 h-28 w-28 rounded-full bg-[#d4b46a]/15 shadow-[0_0_80px_#d4b46a55]" />
        <Title kicker="Night">Eyes closed</Title>
        <p className="text-muted">Stay quiet. Do not look at other phones.</p>
      </div>
    );
  }

  return (
    <>
      <Title kicker="Night">{prompt.title}</Title>
      <p className="mb-5 text-base leading-relaxed">{prompt.instruction}</p>
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
  const named = (id: string) =>
    players.find((player) => player.id === id)?.name ?? id;

  switch (prompt.kind) {
    case "acknowledge":
      return (
        <div className="space-y-4">
          {prompt.seenPlayerIds.length ? (
            <ul className="space-y-2">
              {prompt.seenPlayerIds.map((id) => (
                <li key={id} className="rounded-2xl bg-white/5 px-4 py-3">
                  {named(id)}
                </li>
              ))}
            </ul>
          ) : null}
          {prompt.seenRoles.map((role, index) => (
            <MiniRole key={`${role}-${index}`} role={role} />
          ))}
          {prompt.ownRole ? <MiniRole role={prompt.ownRole} /> : null}
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
          <p className="text-sm text-muted">Pick one player or two center cards.</p>
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
          className={`min-h-12 w-full rounded-2xl px-4 text-left ${
            selected.includes(player.id)
              ? "bg-gold text-black"
              : "bg-white/5"
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
    <div className="grid grid-cols-3 gap-2">
      {CENTER_LABELS.map((label, index) => (
        <button
          key={label}
          type="button"
          onClick={() => onToggle(index)}
          className={`min-h-20 rounded-2xl ${
            selected.includes(index) ? "bg-gold text-black" : "bg-white/5"
          }`}
        >
          {label}
          <span className="block text-xs opacity-70">
            {max === 2 ? "Pick 2" : "Pick 1"}
          </span>
        </button>
      ))}
    </div>
  );
}
