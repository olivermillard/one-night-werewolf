import { Candle } from "@/components/game/Candle";
import { NightTimeline } from "@/components/game/NightTimeline";
import { Button, Columns, Panel, SectionHeading, Title } from "@/components/game/ui";
import type { GameView } from "@/lib/view";
import { useEffect, useState } from "react";

/** Milliseconds left in the day, never below zero. */
function msLeft(endsAt: string | null, totalMs: number): number {
  if (!endsAt) return totalMs;
  return Math.max(0, new Date(endsAt).getTime() - Date.now());
}

export function DayScreen({
  view,
  onStartVote,
  extinguished = false,
}: {
  view: GameView;
  onStartVote: () => void;
  /** The day is over: blow the candle out (the vote is about to begin). */
  extinguished?: boolean;
}) {
  const endsAt = view.room.dayEndsAt;
  const totalMs = view.room.dayTimerSeconds * 1000;
  const [leftMs, setLeftMs] = useState(() => msLeft(endsAt, totalMs));
  useEffect(() => {
    const tick = () => setLeftMs(msLeft(endsAt, totalMs));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [endsAt, totalMs]);

  const out = extinguished || leftMs <= 0;
  const remaining = out ? 0 : Math.ceil(leftMs / 1000);
  const burn = out || totalMs <= 0 ? 0 : leftMs / totalMs;
  const minutes = Math.floor(remaining / 60);
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <>
      <Title kicker="Day">Find the Werewolves</Title>
      <Columns
        left={
          <div className="flex flex-col lg:pt-6">
              <div className="mb-6 flex flex-col items-center">
                <Candle className="h-48 w-24" burn={burn} out={out} />
                <p
                  className={`mt-3 text-center font-[family-name:var(--font-display)] text-6xl tabular-nums transition-colors duration-700 ${
                    out ? "text-muted" : "text-gold [text-shadow:0_0_30px_#a87a3266]"
                  }`}
                  role="timer"
                  aria-live="off"
                >
                  {minutes}:{seconds}
                </p>
                {/* Always laid out, so nothing below shifts when the candle goes out. */}
                <p
                  className={`small-caps mt-1 text-sm tracking-[0.2em] text-muted transition-opacity duration-700 ${
                    out ? "opacity-100" : "opacity-0"
                  }`}
                  aria-hidden={!out}
                >
                  The candle is out
                </p>
              </div>
              {(view.private.messages ?? []).map((text, index) => (
                <Panel key={index} className="mb-5 text-center">
                  <p className="small-caps text-sm tracking-[0.2em] text-gold">
                    A message for you from the Messenger
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-2xl leading-snug text-[#f3e6c8]">
                    &ldquo;{text}&rdquo;
                  </p>
                  <p className="mt-1 text-sm text-muted">Unsigned. It may not be true.</p>
                </Panel>
              ))}
              {view.room.houseRules.allWerewolvesMustDie ? (
                <p className="small-caps mb-4 text-center text-sm tracking-[0.15em] text-gold">
                  House rule: every Werewolf must die
                </p>
              ) : null}
              <p className="mb-4 text-center text-lg text-muted">
                Your card stays face down until the reveal. It may have been swapped in the night.
              </p>
              {out ? (
                <p className="mt-8 text-center text-muted">The vote begins…</p>
              ) : view.me.isHost ? (
                <div className="mt-6">
                  <Button onClick={onStartVote}>Start the vote</Button>
                </div>
              ) : (
                <p className="mt-8 text-center text-muted">The vote begins when the candle burns out.</p>
              )}
          </div>
        }
        right={
          // Desktop: the timeline sits beside the timer, so drop its top gap.
          <div className="flex flex-col lg:-mt-8">
              <SectionHeading>Order of the night</SectionHeading>
              <p className="-mt-1 mb-4 text-center text-sm text-muted">
                Every card in the deck, in the order it is called. Three are in the center, so not every step had someone awake.
              </p>
              <NightTimeline deck={view.room.deck} />
          </div>
        }
      />
    </>
  );
}
