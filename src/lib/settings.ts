/** Host settings shared by the server and the browser. */

export const END_SOUND_OPTIONS = [
  { id: "horn", label: "War horn" },
  { id: "bell", label: "Church bell" },
  { id: "gong", label: "Gong" },
  { id: "howl", label: "Wolf howl" },
  { id: "drums", label: "War drums" },
  { id: "none", label: "No sound" },
] as const;

export type EndSoundId = (typeof END_SOUND_OPTIONS)[number]["id"];

export const DEFAULT_END_SOUND: EndSoundId = "horn";

export function isEndSoundId(value: unknown): value is EndSoundId {
  return END_SOUND_OPTIONS.some((option) => option.id === value);
}
