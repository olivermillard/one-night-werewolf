import { CardBack, RoleCard } from "@/components/cards/RoleCard";
import { Button, Title } from "@/components/game/ui";
import type { GameView } from "@/lib/view";
import { useState } from "react";

export function DealScreen({
  view,
  onClaim,
  onReady,
  onBeginNight,
}: {
  view: GameView;
  onClaim: (slot: number) => void;
  onReady: () => void;
  onBeginNight: () => void;
}) {
  const role = view.private.originalRole;
  const table = view.table;
  const players = view.room.players;
  const readyCount = players.filter((player) => player.ready).length;
  const takenCount = table ? table.taken.filter(Boolean).length : players.length;
  const everyoneHasACard = takenCount >= players.length;

  // Haven't taken a card yet: pick one from the table.
  if (table && table.mySlot === null) {
    return <PickCard taken={table.taken} onClaim={onClaim} playerCount={players.length} takenCount={takenCount} />;
  }

  return (
    <>
      <Title kicker="Look at your card">Keep it secret</Title>
      <p className="-mt-2 mb-5 text-center text-muted">
        This is your only look until dawn. Remember it.
      </p>
      {role ? (
        <LookAtCard key={role} role={role} />
      ) : (
        <p className="text-center text-muted">Your card is on its way.</p>
      )}
      <div className="mt-6 space-y-3">
        <p className="small-caps text-center tracking-[0.2em] text-muted">
          {everyoneHasACard
            ? `${readyCount} of ${players.length} ready`
            : `${takenCount} of ${players.length} have taken a card`}
        </p>
        <Button onClick={onReady} disabled={view.me.ready}>
          {view.me.ready ? "Waiting for others" : "I have seen my card"}
        </Button>
        {view.me.isHost ? (
          <Button variant="ghost" onClick={onBeginNight} disabled={!everyoneHasACard}>
            Everyone close your eyes
          </Button>
        ) : null}
      </div>
    </>
  );
}

function LookAtCard({ role }: { role: NonNullable<GameView["private"]["originalRole"]> }) {
  const [flipped, setFlipped] = useState(false);
  return <RoleCard role={role} flipped={flipped} onClick={() => setFlipped((value) => !value)} />;
}

/**
 * The table: every card face down. Tap one to take it. Taken cards lift and
 * fade away quickly but keep their place, so nothing shifts under a finger.
 */
function PickCard({
  taken,
  onClaim,
  playerCount,
  takenCount,
}: {
  taken: boolean[];
  onClaim: (slot: number) => void;
  playerCount: number;
  takenCount: number;
}) {
  // The card I tapped, gone at once while the server confirms.
  const [picked, setPicked] = useState<number | null>(null);
  const columns = taken.length <= 6 ? "grid-cols-3" : "grid-cols-4";

  return (
    <>
      <Title kicker="The cards are dealt">Take a card</Title>
      <p className="-mt-2 mb-6 text-center text-muted">
        Tap any face-down card to make it yours. The three left over go to the center.
      </p>
      <div className={`grid ${columns} gap-3`}>
        {taken.map((isTaken, slot) => {
          const gone = isTaken || picked === slot;
          return (
            <button
              key={slot}
              type="button"
              disabled={gone || picked !== null}
              aria-label={gone ? "Taken" : `Take card ${slot + 1}`}
              onClick={() => {
                setPicked(slot);
                onClaim(slot);
                // If the server says no (someone beat us to it), let them pick again.
                window.setTimeout(() => setPicked((current) => (current === slot ? null : current)), 2500);
              }}
              className={`relative transition-[opacity,transform,filter] duration-[220ms] ease-out active:scale-95 motion-reduce:transition-none ${
                gone
                  ? "pointer-events-none -translate-y-4 scale-75 rotate-6 opacity-0 blur-[1px]"
                  : "opacity-100"
              }`}
            >
              <CardBack className="w-full drop-shadow-[0_10px_18px_#000c]" />
            </button>
          );
        })}
      </div>
      <p className="small-caps mt-6 text-center tracking-[0.2em] text-muted">
        {takenCount} of {playerCount} have taken a card
      </p>
    </>
  );
}
