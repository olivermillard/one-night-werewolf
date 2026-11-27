import { createDealtState } from "./deal";
import type { CardPositions, GameState, Player, PlayerId, Role } from "./types";

export function playersOf(...names: string[]): Player[] {
  return names.map((name) => ({ id: name.toLowerCase(), name }));
}

export function assignedState(args: {
  players: Player[];
  playerRoles: Record<PlayerId, Role>;
  center: [Role, Role, Role];
}): GameState {
  const deck = [
    ...Object.values(args.playerRoles),
    ...args.center,
  ];
  const original: CardPositions = {
    players: { ...args.playerRoles },
    center: [...args.center] as [Role, Role, Role],
  };
  const dealt = createDealtState(args.players, deck, () => 0);
  return {
    ...dealt,
    original,
    current: {
      players: { ...original.players },
      center: [...original.center] as [Role, Role, Role],
    },
    deck,
  };
}
