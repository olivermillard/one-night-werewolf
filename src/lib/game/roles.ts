import {
  IMMEDIATE_COPY_ROLES,
  assertNever,
  type ImmediateCopyRole,
  type Role,
  type Team,
} from "./types";

export const ROLE_COPIES: Record<Role, number> = {
  werewolf: 2,
  minion: 1,
  mason: 2,
  seer: 1,
  robber: 1,
  troublemaker: 1,
  drunk: 1,
  insomniac: 1,
  villager: 3,
  hunter: 1,
  tanner: 1,
  doppelganger: 1,
  mad_seer: 1,
  poacher: 1,
  herbalist: 1,
  messenger: 1,
};

export const ALL_ROLE_CARDS: Role[] = (
  Object.entries(ROLE_COPIES) as [Role, number][]
).flatMap(([role, copies]) => Array.from({ length: copies }, () => role));

export interface RoleInfo {
  role: Role;
  name: string;
  team: Team;
  nightOrder: number | null;
  blurb: string;
  rules: string;
  accent: string;
  accentSoft: string;
  /** Original to this app rather than the classic set. */
  custom?: boolean;
}

export const ROLE_INFO: Record<Role, RoleInfo> = {
  werewolf: {
    role: "werewolf",
    name: "Werewolf",
    team: "werewolf",
    nightOrder: 2,
    blurb: "Find your partner. Survive the vote.",
    rules:
      "You wake with the other Werewolves and see who they are. If nobody else opens their eyes, your partner is lying in the center, and you may peek at one center card. You play for the werewolf team: get through the vote without the village catching you.",
    accent: "#b42318",
    accentSoft: "#3a1010",
  },
  minion: {
    role: "minion",
    name: "Minion",
    team: "werewolf",
    nightOrder: 3,
    blurb: "See the Werewolves. Protect them.",
    rules:
      "You wake just after the Werewolves and learn who they are, but they never find out who you are. You play for their side, so steer the vote away from them, even onto yourself. If the Werewolves survive, you win with them, even if you die. If no player holds a Werewolf, you win as long as someone other than you is killed.",
    accent: "#7a3cff",
    accentSoft: "#1d1333",
  },
  mason: {
    role: "mason",
    name: "Mason",
    team: "village",
    nightOrder: 4,
    blurb: "Find the other Mason.",
    rules:
      "Masons always come as a pair. You wake together and see each other, so you know one person you can trust. If nobody wakes with you, the other Mason is lying in the center. You play for the village.",
    accent: "#c9a227",
    accentSoft: "#2a220c",
  },
  seer: {
    role: "seer",
    name: "Seer",
    team: "village",
    nightOrder: 6,
    blurb: "Look at one player or two center cards.",
    rules:
      "You get one look in the dark: either another player's card, or two of the three center cards. Nothing moves. You play for the village.",
    accent: "#3b82f6",
    accentSoft: "#0b1a33",
  },
  robber: {
    role: "robber",
    name: "Robber",
    team: "village",
    nightOrder: 7,
    blurb: "Swap with a player, then look.",
    rules:
      "You may swap your card with another player's, then look at what you took. You now are that role and play for its team, but you don't wake again to use it. The person you robbed becomes the Robber and plays for the village. If you don't steal, you stay the Robber.",
    accent: "#15803d",
    accentSoft: "#0c2416",
  },
  troublemaker: {
    role: "troublemaker",
    name: "Troublemaker",
    team: "village",
    nightOrder: 8,
    blurb: "Swap two other players’ cards.",
    rules:
      "You may switch the cards of two other players without seeing either one. Each of them is now whatever card they ended up with. You play for the village.",
    accent: "#ea580c",
    accentSoft: "#2c1408",
  },
  drunk: {
    role: "drunk",
    name: "Drunk",
    team: "village",
    nightOrder: 10,
    blurb: "Must swap with a center card, unseen.",
    rules:
      "You must trade your card for one from the center, and you don't get to see the new one. Whatever you picked up is now your role and your team, and you'll only find out at dawn.",
    accent: "#ca8a04",
    accentSoft: "#2a2208",
  },
  insomniac: {
    role: "insomniac",
    name: "Insomniac",
    team: "village",
    nightOrder: 12,
    blurb: "Look at your card at dawn of night.",
    rules:
      "Near the end of the night you wake and check your own card, so you'll know whether someone swapped it. You play for the village. Best with a Robber or Troublemaker in the deck.",
    accent: "#6366f1",
    accentSoft: "#16143a",
  },
  villager: {
    role: "villager",
    name: "Villager",
    team: "village",
    nightOrder: null,
    blurb: "No night action. Find the Werewolves.",
    rules:
      "No night action and no special power: just your vote and your judgement. Plenty of others will claim to be a Villager too. You play for the village.",
    accent: "#4d7c0f",
    accentSoft: "#14200a",
  },
  hunter: {
    role: "hunter",
    name: "Hunter",
    team: "village",
    nightOrder: null,
    blurb: "If you die, your vote target dies too.",
    rules:
      "If you're killed in the vote, the players you voted for are killed with you, however many votes they got. You play for the village.",
    accent: "#92400e",
    accentSoft: "#231409",
  },
  tanner: {
    role: "tanner",
    name: "Tanner",
    team: "tanner",
    nightOrder: null,
    blurb: "You win only if you die.",
    rules:
      "You're sick of village life and want to be killed: you win only if you die. If you die, the Werewolves can't win. You're on nobody's team, so if every Werewolf is in the center and you're killed, the village loses too.",
    accent: "#a8a29e",
    accentSoft: "#1c1917",
  },
  doppelganger: {
    role: "doppelganger",
    name: "Doppelgänger",
    team: "village",
    nightOrder: 1,
    blurb: "Copy another player’s role.",
    rules:
      "You wake first, look at another player's card, and become a copy of that role on its team. Then you act as it would: a copied Seer, Robber, Troublemaker, Drunk, Herbalist, Messenger or Poacher acts straight away; a Werewolf or Mason wakes with the others; a Minion sees the Werewolves; an Insomniac checks their card at the very end. A copied Villager, Hunter or Tanner does nothing more. Whoever ends up holding your card is the role you copied.",
    accent: "#94a3b8",
    accentSoft: "#151a22",
  },
  mad_seer: {
    role: "mad_seer",
    name: "Mad Seer",
    team: "village",
    nightOrder: 6,
    blurb: "Believes they are the Seer. Every vision is false.",
    rules:
      "You don't know you're mad. Your card shows you the Seer, you wake with the Seer and you look just as the Seer does, but every card you see is shown as the wrong role. Anyone else who looks at your card also sees a Seer. You play for the village. Meant to be played alongside a real Seer, so neither one can be sure.",
    accent: "#a855f7",
    accentSoft: "#22103a",
    custom: true,
  },
  poacher: {
    role: "poacher",
    name: "Poacher",
    team: "poacher",
    nightOrder: 5,
    blurb: "Learn your mark. Win if they die.",
    rules:
      "You wake alone and are shown one other player: your mark. You win if your mark dies, whoever else wins too. The mark belongs to the card, so if your card is taken, its new holder wins if the mark dies, without knowing who it is.",
    accent: "#65a30d",
    accentSoft: "#17220a",
    custom: true,
  },
  herbalist: {
    role: "herbalist",
    name: "Herbalist",
    team: "village",
    nightOrder: 9,
    blurb: "Swap a player’s card with the center, unseen.",
    rules:
      "You may trade another player's card with one of the center cards, without looking at either. That player is now whatever card you gave them. You play for the village.",
    accent: "#0d9488",
    accentSoft: "#0a2422",
    custom: true,
  },
  messenger: {
    role: "messenger",
    name: "Messenger",
    team: "village",
    nightOrder: 11,
    blurb: "Send one anonymous note, read at dawn.",
    rules:
      "Near the end of the night you may write one short note to another player. It reaches them at dawn without your name on it. Tell the truth, or don't. You play for the village.",
    accent: "#d97706",
    accentSoft: "#2a1a08",
    custom: true,
  },
};

export function displayName(role: Role): string {
  return ROLE_INFO[role].name;
}

export function teamOfRole(role: Role): Team {
  switch (role) {
    case "werewolf":
    case "minion":
      return "werewolf";
    case "tanner":
      return "tanner";
    case "poacher":
      return "poacher";
    case "mason":
    case "seer":
    case "robber":
    case "troublemaker":
    case "drunk":
    case "insomniac":
    case "villager":
    case "hunter":
    case "doppelganger":
    case "mad_seer":
    case "herbalist":
    case "messenger":
      return "village";
    default:
      return assertNever(role);
  }
}

export function effectiveRole(
  card: Role,
  doppelgangerCopy: Role | null,
): Role {
  if (card === "doppelganger") {
    return doppelgangerCopy ?? "doppelganger";
  }
  return card;
}

export function isWerewolfRole(role: Role): boolean {
  return role === "werewolf";
}

export function isImmediateCopyRole(role: Role): role is ImmediateCopyRole {
  return (IMMEDIATE_COPY_ROLES as readonly Role[]).includes(role);
}

/**
 * The role a card appears to be to anyone looking at it before the reveal.
 * The Mad Seer looks exactly like the Seer, even to its holder.
 */
export function disguise(role: Role): Role {
  return role === "mad_seer" ? "seer" : role;
}

export function isCustomRole(role: Role): boolean {
  return ROLE_INFO[role].custom === true;
}
