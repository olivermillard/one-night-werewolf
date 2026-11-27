import { MiniRole } from "@/components/cards/RoleCard";
import { ROLE_INFO, type Role } from "@/lib/game";

/** Deck sorted the way the night is called; roles that never wake go last. */
export function deckInWakeOrder(deck: Role[]): Role[] {
  const order = (role: Role) => ROLE_INFO[role].nightOrder ?? 99;
  return [...deck].sort(
    (a, b) => order(a) - order(b) || ROLE_INFO[a].name.localeCompare(ROLE_INFO[b].name),
  );
}

/**
 * Every card in the deck, in the order the roles wake. The deck is public, so
 * this is safe to show at any point in the game.
 */
export function CardsInPlay({ deck }: { deck: Role[] }) {
  const sorted = deckInWakeOrder(deck);
  const wakingRoles = [
    ...new Set(sorted.filter((role) => ROLE_INFO[role].nightOrder !== null)),
  ];
  return (
    <ul className="grid grid-cols-3 gap-3">
      {sorted.map((role, index) => {
        const wakeNumber = wakingRoles.indexOf(role) + 1;
        return (
          <li key={`${role}-${index}`} className="relative">
            <MiniRole role={role} />
            <span
              className={`absolute left-1 top-1 min-w-6 rounded-full border px-1.5 text-center font-[family-name:var(--font-display)] text-sm ${
                wakeNumber
                  ? "border-[#f0d89a] bg-gold text-[#1c120a]"
                  : "border-line bg-panel text-muted"
              }`}
              aria-label={wakeNumber ? `Wakes ${ordinal(wakeNumber)}` : "Does not wake"}
            >
              {wakeNumber || "–"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function ordinal(n: number): string {
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}
