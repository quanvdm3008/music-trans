// Pure layout math for TabView's canvas rendering — kept separate from the
// component so the imperative draw loop in TabView.tsx stays focused on
// drawing calls rather than geometry.
//
// Spacing is proportional to real timing: sixteenth notes sit closer than
// eighth notes, which sit closer than quarter notes — just like real notation.

export const BASE_PPS = 240; // px per second — wide spacing so notes never overlap
export const PAD_L = 48;
export const PAD_R = 32;
export const ROW_TOP = 48;
export const ROW_HEIGHT = 140; // taller for more string spacing
export const ROW_GAP = 36;
export const NOTE_R = 10; // smaller circles — fit between strings without overlap

export function stringY(row: number, s: number, nStrings: number): number {
  return (
    ROW_TOP +
    row * (ROW_HEIGHT + ROW_GAP) +
    (nStrings > 1 ? (s / (nStrings - 1)) * (ROW_HEIGHT - 2 * NOTE_R - 8) : ROW_HEIGHT / 2) +
    NOTE_R + 4
  );
}

export function fmtTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}
