import {
  assertNever,
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
}

export const ROLE_INFO: Record<Role, RoleInfo> = {
  werewolf: {
    role: "werewolf",
    name: "Werewolf",
    team: "werewolf",
    nightOrder: 2,
    blurb: "Find your partner. Survive the vote.",
    rules:
      "At night, all Werewolves open their eyes and look for other Werewolves. If no one else opens their eyes, the other Werewolves are in the center. Werewolves are on the werewolf team. Lone Wolf: if there is only one Werewolf, that Werewolf may view one center card. The village wins only if every Werewolf among the players dies.",
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
      "Immediately following the Werewolf phase, the Minion wakes and sees who the Werewolves are. The Werewolves do not know who the Minion is. If the Minion dies and no Werewolves die, the Werewolves (and the Minion) win. If no players are Werewolves, the Minion wins as long as one other player (not the Minion) dies. The Minion is on the werewolf team.",
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
      "When using the Masons, always put both Masons in the game. The Mason wakes up at night and looks for the other Mason. If the Mason doesn’t see another Mason, the other Mason card is in the center. Masons are on the village team.",
    accent: "#c9a227",
    accentSoft: "#2a220c",
  },
  seer: {
    role: "seer",
    name: "Seer",
    team: "village",
    nightOrder: 5,
    blurb: "Look at one player or two center cards.",
    rules:
      "At night, the Seer may look either at one other player’s card or at two of the center cards, but does not move them. The Seer is on the village team.",
    accent: "#3b82f6",
    accentSoft: "#0b1a33",
  },
  robber: {
    role: "robber",
    name: "Robber",
    team: "village",
    nightOrder: 6,
    blurb: "Swap with a player, then look.",
    rules:
      "At night, the Robber may choose to rob a card from another player and place the Robber card where the other card was. Then the Robber looks at the new card. The player who receives the Robber card is on the village team. The Robber is on the team of the card taken, but does not do the action of the new role at night. If the Robber chooses not to rob, they remain the Robber and are on the village team.",
    accent: "#15803d",
    accentSoft: "#0c2416",
  },
  troublemaker: {
    role: "troublemaker",
    name: "Troublemaker",
    team: "village",
    nightOrder: 7,
    blurb: "Swap two other players’ cards.",
    rules:
      "At night, the Troublemaker may switch the cards of two other players without looking at those cards. The players who receive a different card are now the role (and team) of their new card. The Troublemaker is on the village team.",
    accent: "#ea580c",
    accentSoft: "#2c1408",
  },
  drunk: {
    role: "drunk",
    name: "Drunk",
    team: "village",
    nightOrder: 8,
    blurb: "Must swap with a center card, unseen.",
    rules:
      "The Drunk is so drunk that they don’t remember their role. When it is time to wake up at night, the Drunk must exchange the Drunk card for any card in the center, but does not look at it. The Drunk is now the new role in front of them and is on that team.",
    accent: "#ca8a04",
    accentSoft: "#2a2208",
  },
  insomniac: {
    role: "insomniac",
    name: "Insomniac",
    team: "village",
    nightOrder: 9,
    blurb: "Look at your card at dawn of night.",
    rules:
      "The Insomniac wakes up and looks at her card to see if it has changed. Only use the Insomniac if the Robber and/or the Troublemaker are in the game. The Insomniac is on the village team.",
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
      "The Villager has no special abilities, but is definitely not a Werewolf. Players may often claim to be a Villager. The Villager is on the village team.",
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
      "If the Hunter dies, the player the Hunter is pointing at dies as well, regardless of how many votes that target receives. The Hunter is on the village team.",
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
      "The Tanner hates this job so much that they want to die. The Tanner only wins if they die. If the Tanner dies, the Werewolves do not win. If the Tanner dies and every Werewolf also dies, the village team wins too. The Tanner is considered a member of the village (but is not on their team), so if the Tanner dies when all Werewolves are in the center, the village team loses. The Tanner is not on the werewolf or the villager team.",
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
      "The Doppelgänger wakes first, looks at (but does not switch) one other player’s card, and becomes that role and team. Villager, Tanner, or Hunter: do nothing else at night. Werewolf or Mason: wake with that group. Seer, Robber, Troublemaker, or Drunk: do that action immediately (do not wake again when that role is called). Minion: at the end of the Doppelgänger phase, see who the Werewolves are. Insomniac: after the Insomniac, wake and look at your own card. If a player later receives the Doppelgänger card, they are the role the Doppelgänger originally viewed.",
    accent: "#94a3b8",
    accentSoft: "#151a22",
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
    case "mason":
    case "seer":
    case "robber":
    case "troublemaker":
    case "drunk":
    case "insomniac":
    case "villager":
    case "hunter":
    case "doppelganger":
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

export function isImmediateCopyRole(
  role: Role,
): role is "seer" | "robber" | "troublemaker" | "drunk" {
  return (
    role === "seer" ||
    role === "robber" ||
    role === "troublemaker" ||
    role === "drunk"
  );
}
