import { CardBack, RoleCard } from "@/components/cards/RoleCard";
import { Button, Title } from "@/components/game/ui";
import type { GameView } from "@/lib/view";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** How long a taken card takes to lift and fade off the table (see globals.css). */
const TAKE_ANIMATION_MS = 970;
/** Intro timings; keep in step with the riffle/deal keyframes in globals.css. */
const SHUFFLE_MS = 1150;
const DEAL_STAGGER_MS = 75;
const DEAL_FLIGHT_MS = 420;

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
  const [holdTable, setHoldTable] = useState(false);
  const role = view.private.originalRole;
  const table = view.table;
  const players = view.room.players;
  const readyCount = players.filter((player) => player.ready).length;
  const takenCount = table ? table.taken.filter(Boolean).length : players.length;
  const everyoneHasACard = takenCount >= players.length;

  // Haven't taken a card yet (or my card is still animating away): the table.
  if (table && (table.mySlot === null || holdTable)) {
    return (
      <PickCard
        taken={table.taken}
        onClaim={(slot) => {
          setHoldTable(true);
          window.setTimeout(() => setHoldTable(false), TAKE_ANIMATION_MS);
          onClaim(slot);
        }}
        playerCount={players.length}
        takenCount={takenCount}
      />
    );
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
  // The card I tapped, animating out while the server confirms.
  const [picked, setPicked] = useState<number | null>(null);
  // Cards already gone when the table first appeared don't animate.
  const [takenOnArrival] = useState(() => new Set(taken.flatMap((isTaken, i) => (isTaken ? [i] : []))));
  const columns = taken.length <= 6 ? "grid-cols-3" : "grid-cols-4";

  // Intro: the deck is shuffled in the middle of the table, then dealt out.
  const [intro, setIntro] = useState<"shuffle" | "deal" | "done">(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "done"
      : "shuffle",
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const [offsets, setOffsets] = useState<{ dx: number; dy: number }[]>([]);
  const dealOrder = taken.flatMap((isTaken, slot) => (isTaken ? [] : [slot]));

  // Measure where each card sits relative to the middle of the table, so it
  // can fly there from the deck.
  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || intro === "done") return;
    const box = grid.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    setOffsets(
      Array.from(grid.children).map((child) => {
        const r = (child as HTMLElement).getBoundingClientRect();
        return { dx: cx - (r.left + r.width / 2), dy: cy - (r.top + r.height / 2) };
      }),
    );
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (intro === "done") return;
    const dealAt = window.setTimeout(() => setIntro("deal"), SHUFFLE_MS);
    const doneAt = window.setTimeout(
      () => setIntro("done"),
      SHUFFLE_MS + dealOrder.length * DEAL_STAGGER_MS + DEAL_FLIGHT_MS,
    );
    return () => {
      window.clearTimeout(dealAt);
      window.clearTimeout(doneAt);
    };
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The wrapper runs to the bottom of the screen and clips, so my card can
  // fall off the bottom edge without making the page scroll.
  return (
    <div className="-mx-5 -mb-24 flex flex-1 flex-col overflow-clip px-5 pb-24">
      <Title kicker="The cards are dealt">
        {intro === "shuffle" ? "Shuffling…" : intro === "deal" ? "Dealing…" : "Take a card"}
      </Title>
      <p className="-mt-2 mb-6 text-center text-muted">
        Tap any face-down card to make it yours. The three left over go to the center.
      </p>
      <div className="relative">
        {intro === "shuffle" ? (
          <ShufflingDeck count={Math.min(8, dealOrder.length)} columns={columns} />
        ) : null}
        <div ref={gridRef} className={`grid ${columns} gap-3`}>
          {taken.map((isTaken, slot) => {
            const gone = isTaken || picked === slot;
            // Mine drops down toward me; others' lift away and fade.
            const state = !gone
              ? ""
              : picked === slot
                ? "card-mine"
                : takenOnArrival.has(slot)
                  ? "card-gone"
                  : "card-taken";
            const offset = offsets[slot];
            const dealIndex = dealOrder.indexOf(slot);
            const dealing = intro === "deal" && !gone && offset;
            return (
              <button
                key={slot}
                type="button"
                disabled={gone || picked !== null || intro !== "done"}
                aria-label={gone ? "Taken" : `Take card ${slot + 1}`}
                onClick={() => {
                  setPicked(slot);
                  onClaim(slot);
                  // If the server says no (someone beat us to it), let them pick again.
                  window.setTimeout(
                    () => setPicked((current) => (current === slot ? null : current)),
                    2500,
                  );
                }}
                style={
                  offset
                    ? ({
                        "--dx": `${offset.dx}px`,
                        "--dy": `${offset.dy}px`,
                        "--i": dealIndex,
                        "--r": `${(dealIndex % 2 ? 1 : -1) * (4 + (dealIndex % 3) * 3)}deg`,
                      } as React.CSSProperties)
                    : undefined
                }
                className={`relative transition-transform duration-150 ease-out active:scale-95 ${
                  gone ? "pointer-events-none" : ""
                } ${state === "card-mine" ? "z-10" : ""} ${state} ${
                  intro === "shuffle" && !gone ? "invisible" : ""
                } ${dealing ? "card-dealing" : ""}`}
              >
                <CardBack className="w-full drop-shadow-[0_10px_18px_#000c]" />
              </button>
            );
          })}
        </div>
      </div>
      <p className="small-caps mt-6 text-center tracking-[0.2em] text-muted">
        {takenCount} of {playerCount} have taken a card
      </p>
    </div>
  );
}

/**
 * A deck in the middle of the table being riffle-shuffled: two halves fan
 * apart and interleave back together, twice.
 */
function ShufflingDeck({ count, columns }: { count: number; columns: string }) {
  // Same width as one card on the table.
  const width = columns === "grid-cols-3" ? "w-[calc((100%-1.5rem)/3)]" : "w-[calc((100%-2.25rem)/4)]";
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center" aria-hidden>
      <div className={`relative ${width}`}>
        {/* Sizer so the deck has a card's height. */}
        <CardBack className="invisible w-full" />
        {Array.from({ length: Math.max(count, 2) }, (_, i) => (
          <div
            key={i}
            className={`absolute inset-0 ${i % 2 ? "riffle-right" : "riffle-left"}`}
            style={{ "--k": i, transform: `translateY(${-i * 1.2}px)` } as React.CSSProperties}
          >
            <CardBack className="w-full drop-shadow-[0_6px_10px_#000a]" />
          </div>
        ))}
      </div>
    </div>
  );
}
