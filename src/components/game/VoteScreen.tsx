import { Button, Title } from "@/components/game/ui";
import { MAX_VOTES_PER_PLAYER } from "@/lib/game";
import type { GameView } from "@/lib/view";
import { useState } from "react";

export function VoteScreen({
  view,
  onVote,
}: {
  view: GameView;
  onVote: (playerIds: string[]) => void;
}) {
  const locked = view.private.myVotes;
  const voted = locked.length > 0;
  const [choices, setChoices] = useState<string[]>(locked);
  const selected = voted ? locked : choices;
  const others = view.room.players.filter((player) => player.id !== view.me.id);

  function toggle(id: string) {
    setChoices((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= MAX_VOTES_PER_PLAYER) {
        return [...current.slice(1), id];
      }
      return [...current, id];
    });
  }

  return (
    <>
      <Title kicker="Vote">Point at up to two players</Title>
      <p className="mb-4 text-sm text-muted">
        {view.private.voteCount}/{view.private.playerCount} votes in. Votes stay hidden until everyone has voted.
      </p>
      <div className="space-y-2">
        {others.map((player) => (
          <button
            key={player.id}
            type="button"
            disabled={voted}
            aria-pressed={selected.includes(player.id)}
            onClick={() => toggle(player.id)}
            className={`min-h-14 w-full rounded-2xl px-4 text-left text-lg ${
              selected.includes(player.id) ? "bg-gold text-black" : "bg-white/5"
            }`}
          >
            {player.name}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <Button
          disabled={voted || choices.length === 0}
          onClick={() => choices.length && onVote(choices)}
        >
          {voted
            ? "Vote locked"
            : choices.length === 0
              ? "Pick up to two players"
              : `Lock vote (${choices.length} of ${MAX_VOTES_PER_PLAYER})`}
        </Button>
      </div>
    </>
  );
}
