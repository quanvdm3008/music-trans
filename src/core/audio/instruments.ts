// Selectable playback instruments, each mapped to a General MIDI soundfont.

export type InstrumentSource = 'soundfont-local' | 'soundfont-cdn' | 'synth';

export type InstrumentId = 'piano' | 'guitar' | 'eguitar' | 'violin';

export const INSTRUMENTS: { id: InstrumentId; label: string; gm: string }[] = [
  { id: 'piano', label: '🎹 Piano', gm: 'acoustic_grand_piano' },
  { id: 'guitar', label: '🎸 Guitar', gm: 'acoustic_guitar_steel' },
  { id: 'eguitar', label: '🎸 Guitar điện', gm: 'electric_guitar_clean' },
  { id: 'violin', label: '🎻 Violin', gm: 'violin' },
];

export function gmName(id: InstrumentId): string {
  return (INSTRUMENTS.find((x) => x.id === id) ?? INSTRUMENTS[0]).gm;
}

export interface Instrument {
  source: InstrumentSource;
  play(midi: number, when: number, duration: number, gain: number): void;
  stop(): void;
}
