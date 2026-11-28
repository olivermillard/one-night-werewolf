import { NightTimeline } from "@/components/game/NightTimeline";
import { Button, Columns, Panel, SectionHeading, Title } from "@/components/game/ui";
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
      <Columns
        left={
          <div className="flex flex-col lg:pt-6">
              <p className="mb-6 text-center font-[family-name:var(--font-display)] text-7xl tabular-nums text-gold [text-shadow:0_0_30px_#a87a3266]">
                {minutes}:{seconds}
              </p>
              {(view.private.messages ?? []).map((text, index) => (
                <Panel key={index} className="mb-5 text-center">
                  <p className="small-caps text-sm tracking-[0.2em] text-gold">
                    A note was left for you in the night
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
              {view.me.isHost ? (
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
