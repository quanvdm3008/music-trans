export const TIME_SIGNATURES: { label: string; beats: number; beatType: number }[] = [
  { label: '4/4', beats: 4, beatType: 4 },
  { label: '3/4', beats: 3, beatType: 4 },
  { label: '2/4', beats: 2, beatType: 4 },
  { label: '2/2', beats: 2, beatType: 2 },
  { label: '6/8', beats: 6, beatType: 8 },
  { label: '3/8', beats: 3, beatType: 8 },
];

export const KEY_NAMES: Record<number, string> = {
  [-7]: 'Cb trưởng (7♭)',
  [-6]: 'Gb trưởng (6♭)',
  [-5]: 'Db trưởng (5♭)',
  [-4]: 'Ab trưởng (4♭)',
  [-3]: 'Eb trưởng (3♭)',
  [-2]: 'Bb trưởng (2♭)',
  [-1]: 'F trưởng (1♭)',
  0: 'C trưởng (không dấu)',
  1: 'G trưởng (1♯)',
  2: 'D trưởng (2♯)',
  3: 'A trưởng (3♯)',
  4: 'E trưởng (4♯)',
  5: 'B trưởng (5♯)',
  6: 'F# trưởng (6♯)', 
  7: 'C# trưởng (7♯)',
};

export const GRID_OPTIONS: { label: string; value: number }[] = [
  { label: 'Nốt đen (1/4)', value: 1 },
  { label: 'Móc đơn (1/8)', value: 2 },
  { label: 'Móc kép (1/16)', value: 4 },
];
