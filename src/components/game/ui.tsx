"use client";

import { Moon, moonForStep } from "@/components/game/Moon";
import { NIGHT_STEP_INFO } from "@/lib/game";
import type { NightProgress, WaitingOn } from "@/lib/view";
import { useEffect, useState, type ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-5 pb-24 pt-[max(1.5rem,env(safe-area-inset-top))]">
      {children}
    </div>
  );
}

/** A thin gold rule with a centred lozenge, like a manuscript divider. */
export function Flourish({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-gold-deep ${className}`} aria-hidden>
      <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,currentColor)]" />
      <svg viewBox="0 0 24 12" className="h-3 w-6" fill="currentColor">
        <path d="M12 0 18 6 12 12 6 6Z" />
        <circle cx="2" cy="6" r="1.4" />
        <circle cx="22" cy="6" r="1.4" />
      </svg>
      <span className="h-px flex-1 bg-[linear-gradient(270deg,transparent,currentColor)]" />
    </div>
  );
}

export function Title({
  kicker,
  children,
}: {
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <header className="mb-6 text-center">
      {kicker ? (
        <p className="small-caps text-sm tracking-[0.3em] text-gold">{kicker}</p>
      ) : null}
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-[2.15rem] leading-tight text-[#f3e6c8] [text-shadow:0_2px_12px_#000]">
        {children}
      </h1>
      <Flourish className="mx-auto mt-3 max-w-[14rem]" />
    </header>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger";
  type?: "button" | "submit";
}) {
  const styles =
    variant === "primary"
      ? "border border-[#f0d89a66] bg-[linear-gradient(180deg,#e6c47a,#b88a3c_55%,#9a6e2a)] text-[#1c120a] shadow-[inset_0_1px_0_#fff6,0_8px_20px_#0008] active:brightness-95"
      : variant === "danger"
        ? "border border-[#d0604d66] bg-[linear-gradient(180deg,#a8382a,#7a2116)] text-[#f6e6d4] shadow-[inset_0_1px_0_#fff3,0_8px_20px_#0008]"
        : "border border-line bg-panel/80 text-foreground active:bg-panel-raised";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-13 w-full rounded-lg px-5 font-[family-name:var(--font-display)] text-lg transition-[filter,transform] duration-150 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${styles}`}
    >
      {children}
    </button>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`gilded rounded-xl bg-[linear-gradient(180deg,#2b2018,#1e1611)] p-4 ${className}`}>
      {children}
    </div>
  );
}

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="small-caps mt-8 mb-3 text-center text-base tracking-[0.25em] text-gold">
      {children}
    </h2>
  );
}

/**
 * Errors float at the top of the screen, so they're seen even when the
 * button that caused them is far down a long page.
 */
export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss?: () => void;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto w-full max-w-lg px-4"
    >
      <div className="flex items-start gap-3 rounded-lg border border-[#d0604d] bg-[#3a120c]/95 px-4 py-3 text-base text-[#f6dcd0] shadow-[0_10px_30px_#000c] backdrop-blur">
        <p className="flex-1 leading-snug">{message}</p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xl leading-none text-[#f6dcd0]/80 active:bg-[#5a1a10]"
          >
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Which night step is being called. The real game has a narrator calling
 * each role aloud, so showing the current step to everyone reveals nothing
 * and lets players see the night is moving.
 */
export function NightProgressBar({
  progress,
  showCaller = true,
}: {
  progress: NightProgress;
  /** The big "X, wake up…" line; hidden for the player who is acting. */
  showCaller?: boolean;
}) {
  const { steps, current } = progress;
  if (steps.length === 0) return null;
  const currentStep = steps[current];
  const nextStep = steps[current + 1];
  const label = currentStep ? NIGHT_STEP_INFO[currentStep].label : "Dawn";
  return (
    <div
      className="mb-6"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={Math.min(current + 1, steps.length)}
      aria-valuetext={`${label}, step ${Math.min(current + 1, steps.length)} of ${steps.length}`}
    >
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="small-caps text-sm tracking-[0.2em] text-muted">
          Night · {Math.min(current + 1, steps.length)} of {steps.length}
        </p>
        <p className="truncate text-sm text-muted">
          {nextStep ? `Next: ${NIGHT_STEP_INFO[nextStep].label}` : "Next: dawn"}
        </p>
      </div>
      {/* One moon per role called, waxing from crescent to full by dawn. */}
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, index) => (
          <Moon
            key={step}
            lit={moonForStep(index, steps.length)}
            dim={index > current}
            glow={index === current}
            className={`aspect-square min-w-0 flex-1 transition-transform duration-300 ${
              index === current ? "candle-pulse max-w-9 scale-110" : "max-w-7"
            }`}
          />
        ))}
      </div>
      {showCaller ? (
        <p className="mt-3 text-center font-[family-name:var(--font-display)] text-2xl text-[#f3e6c8]">
          {label}
          <span className="text-muted">, wake up…</span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * Host-only control pinned to the bottom-left. The first tap arms it; a
 * second tap within a few seconds confirms, so a stray tap can't end a game.
 */
export function HostResetButton({ onReset }: { onReset: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(id);
  }, [armed]);
  return (
    <button
      type="button"
      onClick={() => {
        if (armed) {
          setArmed(false);
          onReset();
        } else {
          setArmed(true);
        }
      }}
      className={`fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-50 min-h-10 rounded-md px-3 font-[family-name:var(--font-display)] text-sm shadow-[0_6px_16px_#000a] transition-colors duration-150 ${
        armed
          ? "border border-[#d0604d] bg-[#7a2116] text-[#f6e6d4]"
          : "border border-line/80 bg-[#120d0a]/75 text-muted backdrop-blur"
      }`}
    >
      {armed ? "Tap again to reset" : "Reset game"}
    </button>
  );
}

/** Host only: who the game is still waiting on in this phase. */
export function WaitingOnBanner({ waiting }: { waiting: WaitingOn }) {
  if (waiting.names.length === 0) return null;
  return (
    <div className="mb-5 rounded-lg border border-line bg-panel/85 px-4 py-3">
      <p className="small-caps text-sm tracking-[0.2em] text-gold">
        Host · waiting on {waiting.names.length} to {waiting.action}
      </p>
      <p className="mt-1 text-lg leading-snug text-[#f3e6c8]">{waiting.names.join(", ")}</p>
    </div>
  );
}
