// Builds the raw chord/rest timeline for a staff and splits it at barlines
// into tied note-value tokens (see quantize.ts for the overall pipeline).

import { decompose, type NoteValueToken } from './note-values';
import type { MeasureElement } from './quantize.types';

export interface RawSpan {
  start: number; // global grid units
  dur: number; // grid units (>=1)
  isRest: boolean;
  midis: number[];
}

export function secondsToUnits(seconds: number, secondsPerGrid: number): number {
  return Math.round(seconds / secondsPerGrid);
}

/** Group same-onset notes on a staff into chords and fill gaps with rests. */
export function buildSpans(
  staffNotes: { start: number; dur: number; midi: number }[],
  totalUnits: number,
): RawSpan[] {
  if (staffNotes.length === 0) {
    return totalUnits > 0 ? [{ start: 0, dur: totalUnits, isRest: true, midis: [] }] : [];
  }
  // Group by onset.
  const byOnset = new Map<number, { dur: number; midis: Set<number> }>();
  for (const n of staffNotes) {
    const g = byOnset.get(n.start) ?? { dur: 0, midis: new Set<number>() };
    g.dur = Math.max(g.dur, n.dur);
    g.midis.add(n.midi);
    byOnset.set(n.start, g);
  }
  const onsets = [...byOnset.keys()].sort((a, b) => a - b);

  const spans: RawSpan[] = [];
  let pos = 0;
  for (let i = 0; i < onsets.length; i++) {
    const start = onsets[i];
    const group = byOnset.get(start)!;
    if (start > pos) {
      spans.push({ start: pos, dur: start - pos, isRest: true, midis: [] });
    }
    const nextOnset = i + 1 < onsets.length ? onsets[i + 1] : totalUnits;
    const maxDur = Math.max(1, nextOnset - start);
    const dur = Math.min(Math.max(1, group.dur), maxDur);
    spans.push({
      start,
      dur,
      isRest: false,
      midis: [...group.midis].sort((a, b) => a - b),
    });
    pos = start + dur;
  }
  if (pos < totalUnits) {
    spans.push({ start: pos, dur: totalUnits - pos, isRest: true, midis: [] });
  }
  return spans;
}

/** Split spans at barlines and decompose into tied note values per measure. */
export function spansToMeasures(
  spans: RawSpan[],
  divisionsPerMeasure: number,
  numberOfMeasures: number,
  table: NoteValueToken[],
): MeasureElement[][] {
  const measures: MeasureElement[][] = Array.from({ length: numberOfMeasures }, () => []);

  for (const span of spans) {
    let cursor = span.start;
    let remaining = span.dur;
    while (remaining > 0) {
      const measureIndex = Math.floor(cursor / divisionsPerMeasure);
      if (measureIndex >= numberOfMeasures) break;
      const measureEnd = (measureIndex + 1) * divisionsPerMeasure;
      const seg = Math.min(remaining, measureEnd - cursor);
      const isFirstSeg = cursor === span.start;
      const isLastSeg = remaining - seg === 0;
      const tokens = decompose(seg, table);
      for (let t = 0; t < tokens.length; t++) {
        const tok = tokens[t];
        const firstToken = isFirstSeg && t === 0;
        const lastToken = isLastSeg && t === tokens.length - 1;
        measures[measureIndex].push({
          isRest: span.isRest,
          midis: span.midis,
          durationUnits: tok.units,
          type: tok.type,
          dots: tok.dots,
          tieStop: !span.isRest && !firstToken,
          tieStart: !span.isRest && !lastToken,
        });
      }
      cursor += seg;
      remaining -= seg;
    }
  }

  // Guarantee every measure has at least a full-measure rest (empty bars).
  for (let m = 0; m < numberOfMeasures; m++) {
    if (measures[m].length === 0) {
      for (const tok of decompose(divisionsPerMeasure, table)) {
        measures[m].push({
          isRest: true,
          midis: [],
          durationUnits: tok.units,
          type: tok.type,
          dots: tok.dots,
          tieStart: false,
          tieStop: false,
        });
      }
    }
  }
  return measures;
}

export function medianMidi(midis: number[]): number | null {
  if (midis.length === 0) return null;
  const sorted = [...midis].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
