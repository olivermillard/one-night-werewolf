import { Button, Title } from "@/components/game/ui";
import type { GameView } from "@/lib/view";
import { useEffect, useState } from "react";

export function DayScreen({
  view,
  onStartVote,
}: {
  view: GameView;
  onStartVote: () => void;
}) {
  const [remaining, setRemaining] = useState(view.room.dayTimerSeconds);
  useEffect(() => {
    const endsAt = view.room.dayEndsAt;
    const id = window.setInterval(() => {
      if (!endsAt) {
        setRemaining(view.room.dayTimerSeconds);
        return;
      }
      setRemaining(
        Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 1000)),
      );
    }, 250);
    return () => window.clearInterval(id);
  }, [view.room.dayEndsAt, view.room.dayTimerSeconds]);
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <>
      <Title kicker="Day">Find the Werewolves</Title>
      <p className="mb-6 text-center font-[family-name:var(--font-display)] text-5xl text-gold">
        {minutes}:{seconds}
      </p>
      <p className="mb-4 text-sm text-muted">
        Your card stays face down until the reveal. It may have been swapped in the night.
      </p>
      {view.me.isHost ? (
        <div className="mt-6">
          <Button onClick={onStartVote}>Start the vote</Button>
        </div>
      ) : (
        <p className="mt-6 text-center text-muted">Vote begins when the timer ends.</p>
      )}
    </>
  );
}
