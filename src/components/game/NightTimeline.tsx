import { MiniRole } from "@/components/cards/RoleCard";
import { Moon, moonForStep } from "@/components/game/Moon";
import {
  NIGHT_STEP_INFO,
  ROLE_INFO,
  countRoles,
  publicNightSteps,
  type CalledNightStep,
  type NightLogEntry,
  type Role,
} from "@/lib/game";

/** What the narrator asks of each step, in plain words. */
const STEP_ACTION: Record<CalledNightStep, string> = {
  doppelganger_copy: "Looks at another player's card and becomes that role.",
  doppelganger_action:
    "If they copied the Seer, Robber, Troublemaker or Drunk, does that action now.",
  doppelganger_minion: "If they copied the Minion, sees who the Werewolves are.",
  werewolves: "Wake and see each other. A lone Werewolf may look at a center card.",
  minion: "Sees who the Werewolves are. They don't see the Minion.",
  masons: "Wake and see each other.",
  seer: "Looks at one player's card, or two center cards.",
  robber: "May swap cards with another player, then looks at the new card.",
  troublemaker: "May swap two other players' cards without looking.",
  drunk: "Swaps their card with a center card without looking.",
  insomniac: "Looks at their own card to see if it changed.",
  doppelganger_insomniac: "If they copied the Insomniac, looks at their card.",
};

const STEP_ROLES: Partial<Record<CalledNightStep, Role>> = {
  werewolves: "werewolf",
  masons: "mason",
};

/**
 * The night as the narrator calls it for this deck, as if every card were in
 * play. Built only from the (public) deck. Pass `events` on the reveal to show
 * what actually happened at each step.
 */
export function NightTimeline({
  deck,
  events,
}: {
  deck: Role[];
  events?: NightLogEntry[];
}) {
  const steps = publicNightSteps(deck);
  const counts = countRoles(deck);
  const neverWake = [...new Set(deck)]
    .filter((role) => ROLE_INFO[role].nightOrder === null)
    .sort((a, b) => ROLE_INFO[a].name.localeCompare(ROLE_INFO[b].name));

  return (
    <ol className="relative ml-3 border-l border-line">
      {steps.map((step, index) => {
        const info = NIGHT_STEP_INFO[step];
        const role = STEP_ROLES[step] ?? info.role;
        const copies = counts[role];
        const happened = events?.filter((entry) => entry.step === step);
        return (
          <li key={step} className="relative pb-5 pl-6 last:pb-6">
            <Moon
              lit={moonForStep(index, steps.length)}
              className="absolute -left-[0.8rem] top-1 h-6 w-6 rounded-full bg-background"
            />
            <div className="flex gap-3">
              <div className="w-14 shrink-0">
                <MiniRole role={role} size="sm" bare />
              </div>
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-display)] text-xl leading-tight text-[#f3e6c8]">
                  <span className="mr-1.5 text-gold">{index + 1}.</span>
                  {info.label}
                  {copies > 1 && (step === "werewolves" || step === "masons") ? (
                    <span className="ml-1.5 text-base text-muted">×{copies}</span>
                  ) : null}
                </p>
                <p className="mt-0.5 leading-snug text-muted">{STEP_ACTION[step]}</p>
                {happened ? (
                  happened.length ? (
                    happened.map((entry, entryIndex) => (
                      <p key={entryIndex} className="mt-1.5 leading-snug text-[#e6d8ba]">
                        {entry.summary}
                      </p>
                    ))
                  ) : (
                    <p className="small-caps mt-1.5 text-sm tracking-[0.12em] text-muted/80">
                      No one acted
                    </p>
                  )
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
      {neverWake.length ? (
        <li className="relative pl-6">
          <span className="absolute -left-[0.8rem] top-1 h-6 w-6 rounded-full border border-line bg-background" />
          <p className="font-[family-name:var(--font-display)] text-xl leading-tight text-[#f3e6c8]">
            Never wake
          </p>
          <p className="mt-0.5 leading-snug text-muted">No night action. Find the Werewolves by day.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {neverWake.map((role) => (
              <div key={role} className="w-14 text-center">
                <MiniRole role={role} size="sm" />
                {counts[role] > 1 ? (
                  <p className="mt-0.5 text-sm text-muted">×{counts[role]}</p>
                ) : null}
              </div>
            ))}
          </div>
        </li>
      ) : null}
    </ol>
  );
}
