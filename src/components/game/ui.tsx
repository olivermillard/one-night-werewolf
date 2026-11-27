import type { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      {children}
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
    <header className="mb-6">
      {kicker ? (
        <p className="text-xs uppercase tracking-[0.35em] text-gold">{kicker}</p>
      ) : null}
      <h1 className="font-[family-name:var(--font-display)] text-3xl leading-tight">
        {children}
      </h1>
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
      ? "bg-gold text-black"
      : variant === "danger"
        ? "bg-[#b42318] text-white"
        : "border border-white/15 bg-white/5 text-foreground";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-12 w-full rounded-2xl px-4 text-base font-semibold disabled:opacity-40 ${styles}`}
    >
      {children}
    </button>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-panel/80 p-4">
      {children}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-2xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-100">
      {message}
    </p>
  );
}
