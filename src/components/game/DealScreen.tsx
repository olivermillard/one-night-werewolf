import { RoleCard } from "@/components/cards/RoleCard";
import { Button, Title } from "@/components/game/ui";
import type { GameView } from "@/lib/view";
import { useState } from "react";

export function DealScreen({
  view,
  onReady,
  onBeginNight,
}: {
  view: GameView;
  onReady: () => void;
  onBeginNight: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const role = view.private.originalRole;
  const readyCount = view.room.players.filter((player) => player.ready).length;

  return (
    <>
      <Title kicker="Look at your card">Keep it secret</Title>
      <p className="-mt-2 mb-5 text-center text-muted">
        This is your only look until dawn. Remember it.
      </p>
      {role ? (
        <RoleCard role={role} flipped={flipped} onClick={() => setFlipped((value) => !value)} />
      ) : (
        <p className="text-muted">Your card is still being dealt.</p>
      )}
      <div className="mt-6 space-y-3">
        <p className="small-caps text-center tracking-[0.2em] text-muted">
          {readyCount} of {view.room.players.length} ready
        </p>
        <Button onClick={onReady} disabled={view.me.ready}>
          {view.me.ready ? "Waiting for others" : "I have seen my card"}
        </Button>
        {view.me.isHost ? (
          <Button variant="ghost" onClick={onBeginNight}>
            Everyone close your eyes
          </Button>
        ) : null}
      </div>
    </>
  );
}
