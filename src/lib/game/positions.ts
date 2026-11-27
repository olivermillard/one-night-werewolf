import type { CardPositions, PlayerId, Role } from "./types";

export function clonePositions(positions: CardPositions): CardPositions {
  return {
    players: { ...positions.players },
    center: [...positions.center] as [Role, Role, Role],
  };
}

export function swapPlayers(
  positions: CardPositions,
  a: PlayerId,
  b: PlayerId,
): CardPositions {
  const next = clonePositions(positions);
  const roleA = next.players[a];
  const roleB = next.players[b];
  if (!roleA || !roleB) {
    throw new Error("Cannot swap unknown players.");
  }
  next.players[a] = roleB;
  next.players[b] = roleA;
  return next;
}

export function swapPlayerWithCenter(
  positions: CardPositions,
  playerId: PlayerId,
  centerIndex: number,
): CardPositions {
  if (centerIndex < 0 || centerIndex > 2) {
    throw new Error("Center index must be 0, 1, or 2.");
  }
  const next = clonePositions(positions);
  const playerRole = next.players[playerId];
  const centerRole = next.center[centerIndex];
  if (!playerRole || !centerRole) {
    throw new Error("Cannot swap missing cards.");
  }
  next.players[playerId] = centerRole;
  next.center[centerIndex] = playerRole;
  return next;
}

export function playerName(
  players: { id: PlayerId; name: string }[],
  playerId: PlayerId,
): string {
  return players.find((player) => player.id === playerId)?.name ?? playerId;
}
