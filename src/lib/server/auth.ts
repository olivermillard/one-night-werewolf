import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export function createPlayerToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokensMatch(token: string, tokenHash: string): boolean {
  const hashed = hashToken(token);
  const a = Buffer.from(hashed, "utf8");
  const b = Buffer.from(tokenHash, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function randomRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(5);
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    const byte = bytes[i] ?? 0;
    code += alphabet[byte % alphabet.length];
  }
  return code;
}

export function emptyStepDelayMs(rng: () => number = Math.random): number {
  return 4000 + Math.floor(rng() * 5000);
}

/** A uniform number in [0, 1) from the OS's secure random source, for dealing cards. */
export function secureRandom(): number {
  return randomInt(0, 2 ** 47) / 2 ** 47;
}
