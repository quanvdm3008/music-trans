// Representable note-value durations (plain + dotted) for a given grid, and
// greedy decomposition of an arbitrary span into a tied sequence of them.

export interface NoteValueToken {
  units: number;
  type: string;
  dots: number;
}

const BASE_NOTE_TYPES: ReadonlyArray<{ type: string; quarters: number }> = [
  { type: 'whole', quarters: 4 },
  { type: 'half', quarters: 2 },
  { type: 'quarter', quarters: 1 },
  { type: 'eighth', quarters: 0.5 },
  { type: '16th', quarters: 0.25 },
  { type: '32nd', quarters: 0.125 },
];

/** Build the table of representable note values (plain + dotted) for a grid. */
export function noteValueTable(divisionsPerQuarter: number): NoteValueToken[] {
  const out: NoteValueToken[] = [];
  for (const b of BASE_NOTE_TYPES) {
    const plain = b.quarters * divisionsPerQuarter;
    if (Number.isInteger(plain) && plain >= 1) {
      out.push({ units: plain, type: b.type, dots: 0 });
    }
    const dotted = b.quarters * 1.5 * divisionsPerQuarter;
    if (Number.isInteger(dotted) && dotted >= 1) {
      out.push({ units: dotted, type: b.type, dots: 1 });
    }
  }
  out.sort((a, b) => b.units - a.units);
  return out;
}

/** Greedily decompose a within-measure span into tied note-value tokens. */
export function decompose(units: number, table: NoteValueToken[]): NoteValueToken[] {
  const tokens: NoteValueToken[] = [];
  let remaining = units;
  // `table` always contains a 1-unit value (the grid note), so this terminates.
  let guard = 0;
  while (remaining > 0 && guard++ < 1000) {
    const pick = table.find((t) => t.units <= remaining);
    if (!pick) break;
    tokens.push(pick);
    remaining -= pick.units;
  }
  return tokens;
}
