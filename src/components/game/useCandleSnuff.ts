import { useEffect, useState } from "react";
import type { GameView } from "@/lib/view";

/** How long the candle takes to go out (keep in step with .candle-* in globals.css). */
export const SNUFF_MS = 2600;

/**
 * When the day ends (the timer runs out, or the host starts the vote early),
 * keep showing the last day view for a moment so the candle can go out and
 * the smoke can rise, then let the vote through.
 *
 * Returns the view to draw, and whether the candle is going out.
 */
export function useCandleSnuff(view: GameView | null): {
  shown: GameView | null;
  snuffing: boolean;
} {
  const [last, setLast] = useState(view);
  const [held, setHeld] = useState<GameView | null>(null);

  // Adjust during render (not in an effect) so the vote never flashes up
  // for a frame before the day view is held.
  if (view !== last) {
    setLast(view);
    if (
      last?.room.phase === "day" &&
      view?.room.phase === "vote" &&
      last.room.id === view.room.id
    ) {
      setHeld(last);
    } else if (held && view?.room.phase !== "vote") {
      // The game moved on another way (a restart, say): stop holding.
      setHeld(null);
    }
  }

  useEffect(() => {
    if (!held) return;
    const id = window.setTimeout(() => setHeld(null), SNUFF_MS);
    return () => window.clearTimeout(id);
  }, [held]);

  return held ? { shown: held, snuffing: true } : { shown: view, snuffing: false };
}
