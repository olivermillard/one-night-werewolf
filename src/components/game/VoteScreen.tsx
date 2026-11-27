import { Button, Title } from "@/components/game/ui";
import type { GameView } from "@/lib/view";
import { useState } from "react";

export function VoteScreen({
  view,
  onVote,
}: {
  view: GameView;
  onVote: (playerId: string) => void;
}) {
  const [choice, setChoice] = useState<string | null>(view.private.myVote);
  const others = view.room.players.filter((player) => player.id !== view.me.id);
  const voted = Boolean(view.private.myVote);

  return (
    <>
      <Title kicker="Vote">Point at someone</Title>
      <p className="mb-4 text-sm text-muted">
        {view.private.voteCount}/{view.private.playerCount} votes in. Votes stay hidden until everyone has voted.
      </p>
      <div className="space-y-2">
        {others.map((player) => (
          <button
            key={player.id}
            type="button"
            disabled={voted}
            onClick={() => setChoice(player.id)}
            className={`min-h-14 w-full rounded-2xl px-4 text-left text-lg ${
              choice === player.id ? "bg-gold text-black" : "bg-white/5"
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <Button
          disabled={voted || !choice}
          onClick={() => choice && onVote(choice)}
        >
          {voted ? "Vote locked" : "Lock vote"}
        </Button>
      </div>
    </>
  );
}
