import { useEffect, useMemo, useRef } from 'react';
import { midiToNoteName } from '../../../core/music/notation';
import type { NoteEventTime } from '../../../core/music/note-event';
import { OPEN_PITCHES } from '../../tablature/tab';
import type { TuningId } from '../../tablature/tablature.store';

interface FretboardProps {
  /** Which tuning is selected (drives string count + open pitches). */
  tuning: TuningId;
  /** Capo fret (guitar only). Shifts every open string up by this many semitones. */
  capo?: number;
  notes: NoteEventTime[];
  isPlaying: boolean;
  getTime: () => number | null;
}

const FRET_COUNT = 15;
const MARKER_FRETS = [3, 5, 7, 9, 12];

/**
 * Map a MIDI note to the playable (stringIndex, fret) with the smallest fret,
 * relative to the capo. `open` are the base open-string pitches; the capo raises
 * each by `capo` semitones, so the displayed fret is read from the capo (the way
 * a guitarist actually fingers it) and stays in sync with the tab.
 */
function position(midi: number, open: number[], capo: number): { s: number; fret: number } | null {
  let best: { s: number; fret: number } | null = null;
  for (let s = 0; s < open.length; s++) {
    const fret = midi - (open[s] + capo);
    if (fret >= 0 && fret <= FRET_COUNT) {
      if (!best || fret < best.fret) best = { s, fret };
    }
  }
  return best;
}

/** A fretboard view (guitar/violin) that lights up notes as they play. */
export function Fretboard({ tuning: tuningId, capo = 0, notes, isPlaying, getTime }: FretboardProps) {
  const tuning = OPEN_PITCHES[tuningId] ?? OPEN_PITCHES.standard;
  const effectiveCapo = tuningId === 'violin' ? 0 : capo;

  const rollNotes = useMemo(
    () =>
      notes.map((n) => ({
        s: n.startTimeSeconds,
        e: n.startTimeSeconds + Math.max(0.08, n.durationSeconds),
        m: Math.round(n.pitchMidi),
      })),
    [notes],
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let stopped = false;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      if (stopped) return;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      const padL = 40;
      const padR = 10;
      const padY = 16;
      const boardW = W - padL - padR;
      const fretW = boardW / FRET_COUNT;
      const nStr = tuning.length;
      const stringY = (s: number) => padY + (H - 2 * padY) * (s / (nStr - 1));
      const fretX = (f: number) => padL + f * fretW;
      // marker position for a fret = middle of the space behind that fret
      const cellX = (f: number) => (f === 0 ? padL - fretW * 0.45 : fretX(f) - fretW / 2);

      ctx.clearRect(0, 0, W, H);

      // wood background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#3a2a1d');
      grad.addColorStop(1, '#241913');
      ctx.fillStyle = grad;
      ctx.fillRect(padL, 4, boardW, H - 8);

      // inlay markers
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      for (const f of MARKER_FRETS) {
        if (f > FRET_COUNT) continue;
        const x = fretX(f) - fretW / 2;
        if (f === 12) {
          ctx.beginPath();
          ctx.arc(x, stringY(0) + (stringY(nStr - 1) - stringY(0)) * 0.28, 4, 0, 7);
          ctx.arc(x, stringY(0) + (stringY(nStr - 1) - stringY(0)) * 0.72, 4, 0, 7);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(x, (stringY(0) + stringY(nStr - 1)) / 2, 4, 0, 7);
          ctx.fill();
        }
      }

      // frets
      for (let f = 0; f <= FRET_COUNT; f++) {
        ctx.strokeStyle = f === 0 ? '#e8e8ea' : 'rgba(200,200,210,0.45)';
        ctx.lineWidth = f === 0 ? 4 : 1.5;
        ctx.beginPath();
        ctx.moveTo(fretX(f), 4);
        ctx.lineTo(fretX(f), H - 4);
        ctx.stroke();
      }

      // strings + labels
      for (let s = 0; s < nStr; s++) {
        const y = stringY(s);
        ctx.strokeStyle = 'rgba(220,220,230,0.55)';
        ctx.lineWidth = 1 + (s / (nStr - 1)) * 2.2; // lower strings thicker
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(W - padR, y);
        ctx.stroke();
        ctx.fillStyle = '#8a93a3';
        ctx.font = '11px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(midiToNoteName(tuning[s]).replace(/\d/, ''), padL - 8, y);
      }

      // active notes
      const t = isPlaying ? getTime() : null;
      if (t != null) {
        for (const n of rollNotes) {
          if (n.s > t || n.e <= t) continue;
          const pos = position(n.m, tuning, effectiveCapo);
          if (!pos) continue;
          const x = cellX(pos.fret);
          const y = stringY(pos.s);
          ctx.shadowColor = 'rgba(124,110,255,0.9)';
          ctx.shadowBlur = 16;
          ctx.fillStyle = '#9db4ff';
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, 7);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#0b0d12';
          ctx.font = 'bold 10px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(pos.fret), x, y);
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [tuning, effectiveCapo, rollNotes, isPlaying, getTime]);

  return (
    <div className="fretboard">
      <canvas ref={canvasRef} className="fretboard__canvas" />
    </div>
  );
}
