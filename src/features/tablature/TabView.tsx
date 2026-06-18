import { useEffect, useMemo, useRef } from 'react';
import type { NoteEventTime } from '../../core/music/note-event';
import { generateTab, type TabData } from './tab';
import { useTablatureStore } from './tablature.store';
import { BASE_PPS, NOTE_R, PAD_L, PAD_R, ROW_GAP, ROW_HEIGHT, ROW_TOP, fmtTime, stringY } from './tab-view-geometry';
import { detectChordsFromNotes, type ChordEvent } from '../../core/music/chords';

interface TabViewProps {
  notes: NoteEventTime[];
  isPlaying: boolean;
  getTime: () => number | null;
  /** Pre-computed chord events (from parent using BPM/time sig). If not provided, computed internally. */
  chords?: ChordEvent[];
  /** Exact bar duration in seconds (e.g. 2.0 for 120BPM 4/4). If set, rows align to bars. */
  barDuration?: number;
  /** How many bars per row. Default 2. */
  barsPerRow?: number;
}

/**
 * Canvas-rendered guitar tab with:
 * - Chord labels written ON the tab lines
 * - | separators between chord groups
 * - Wider spacing for readability (~4 chords per row)
 * - Playback highlighting & playhead
 * - Clean MelodyScribe Pro styling
 */
export function TabView({ notes, isPlaying, getTime, chords: externalChords, barDuration, barsPerRow = 2 }: TabViewProps) {
  const { tuning, capo, zoom } = useTablatureStore();
  const tab = useMemo<TabData>(() => generateTab(notes, tuning, capo), [notes, tuning, capo]);
  const chords = useMemo<ChordEvent[]>(
    () => externalChords ?? detectChordsFromNotes(notes as any, 200),
    [notes, externalChords],
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nStrings = tab.labels.length;
    const pps = BASE_PPS * zoom;
    let raf = 0;
    let stopped = false;
    let lastHeightPx = -1;

    const draw = () => {
      if (stopped) return;
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.clientWidth || 1;

      // Force exact bars per row if barDuration is set
      const secondsPerRow = barDuration ? barDuration * barsPerRow : (Math.max(80, W - PAD_L - PAD_R) / pps);
      const barDur = barDuration ?? (secondsPerRow / barsPerRow);

      // Compute which rows have notes (skip empty rows)
      const lastTime = tab.columns.length ? tab.columns[tab.columns.length - 1].time : 0;
      const totalRows = Math.max(1, Math.ceil((lastTime + 0.1) / secondsPerRow));
      const nonEmptyRows: number[] = [];
      for (let r = 0; r < totalRows; r++) {
        const rowStart = r * secondsPerRow;
        const rowEnd = (r + 1) * secondsPerRow;
        const hasNotes = tab.columns.some(c => c.time >= rowStart && c.time < rowEnd);
        if (hasNotes) nonEmptyRows.push(r);
      }
      if (nonEmptyRows.length === 0) nonEmptyRows.push(0);

      const rows = nonEmptyRows;
      const heightPx = rows.length * (ROW_HEIGHT + ROW_GAP) + ROW_TOP;

      if (heightPx !== lastHeightPx) {
        canvas.style.height = `${heightPx}px`;
        lastHeightPx = heightPx;
      }
      const H = heightPx;
      const pxW = Math.max(1, Math.floor(W * dpr));
      const pxH = Math.max(1, Math.floor(H * dpr));
      if (canvas.width !== pxW || canvas.height !== pxH) {
        canvas.width = pxW;
        canvas.height = pxH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const t = isPlaying ? getTime() : null;
      const activeRealRow = t != null ? Math.floor(t / secondsPerRow) : -1;

      for (let displayRow = 0; displayRow < rows.length; displayRow++) {
        const realRow = rows[displayRow];
        const rowTop = displayRow * (ROW_HEIGHT + ROW_GAP);
        const rowStartTime = realRow * secondsPerRow;
        const rowEndTime = (realRow + 1) * secondsPerRow;
        const active = realRow === activeRealRow;

        // Background card per row
        ctx.fillStyle = active ? '#F0F9FF' : '#F8FAFC';
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(2, rowTop + 2, W - 4, ROW_HEIGHT + ROW_GAP - 4, 12);
          ctx.fill();
        } else {
          ctx.fillRect(2, rowTop + 2, W - 4, ROW_HEIGHT + ROW_GAP - 4);
        }

        // Timestamp + bar info
        ctx.fillStyle = '#64748B';
        ctx.font = '600 10px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const barStart = Math.round(rowStartTime / barDur) + 1;
        const barEnd = barStart + barsPerRow - 1;
        ctx.fillText(`${fmtTime(rowStartTime)}  bar ${barStart}-${barEnd}`, 6, rowTop + 14);

        // Chord labels — positioned at first note of each chord
        const rowChords = chords.filter(ch => ch.time >= rowStartTime && ch.time < rowEndTime);
        const topStringY = stringY(displayRow, 0, nStrings);
        const bottomStringY = stringY(displayRow, nStrings - 1, nStrings);
        for (let ci = 0; ci < rowChords.length; ci++) {
          const ch = rowChords[ci];
          const nextCh = ci + 1 < rowChords.length ? rowChords[ci + 1] : null;
          const nextTime = nextCh ? nextCh.time : rowEndTime;

          // Find the first column that starts inside this chord's time range
          const firstCol = tab.columns.find(c => c.time >= ch.time && c.time < nextTime);
          // Use first note time, fallback to chord start time
          const markerTime = firstCol ? firstCol.time : ch.time;
          const cx = PAD_L + (markerTime - rowStartTime) * pps;
          if (cx < PAD_L || cx > W - PAD_R) continue;

          // === Horizontal separator line BEFORE this chord (from prev chord to here) ===
          if (ci > 0) {
            const prevCh = rowChords[ci - 1];
            const prevFirstCol = tab.columns.find(c => c.time >= prevCh.time && c.time < ch.time);
            const prevTime = prevFirstCol ? prevFirstCol.time : prevCh.time;
            const prevCx = PAD_L + (prevTime - rowStartTime) * pps;
            // Thin horizontal line above strings between chords
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 6]);
            ctx.beginPath();
            ctx.moveTo(prevCx + NOTE_R + 4, topStringY - NOTE_R - 2);
            ctx.lineTo(cx - NOTE_R - 4, topStringY - NOTE_R - 2);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Semi-transparent band
          ctx.fillStyle = ci % 2 === 0 ? 'rgba(14,165,233,0.02)' : 'rgba(16,185,129,0.02)';
          const bandEnd = nextCh
            ? PAD_L + ((tab.columns.find(c => c.time >= nextCh.time)?.time ?? nextCh.time) - rowStartTime) * pps
            : W - PAD_R;
          ctx.fillRect(cx, topStringY - NOTE_R, Math.max(0, bandEnd - cx), bottomStringY - topStringY + NOTE_R * 2);

          // Vertical marker through all strings at first note position
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, rowTop + 4);
          ctx.lineTo(cx, bottomStringY + NOTE_R + 2);
          ctx.stroke();

          // Dot with bar number
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(cx, rowTop + 6, 3, 0, Math.PI * 2);
          ctx.fill();

          // Chord name
          const label = ch.chord.name;
          const timeLabel = fmtTime(ch.time);
          const labelW = ctx.measureText(`${label}  ${timeLabel}`).width + 18;
          ctx.fillStyle = '#ECFDF5';
          ctx.strokeStyle = '#A7F3D0';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(cx - labelW / 2, rowTop + 10, labelW, 20, 6);
          else ctx.fillRect(cx - labelW / 2, rowTop + 10, labelW, 20);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#059669';
          ctx.font = 'bold 11px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, cx - 14, rowTop + 20);
          ctx.fillStyle = '#34D399';
          ctx.font = '600 9px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.fillText(timeLabel, cx + (ctx.measureText(label).width / 2) + 4, rowTop + 20);
        }

        // String lines + labels — use displayRow for Y
        for (let s = 0; s < nStrings; s++) {
          const y = stringY(displayRow, s, nStrings);
          ctx.strokeStyle = 'rgba(148,163,184,0.35)';
          ctx.lineWidth = 1 + (s / Math.max(1, nStrings - 1)) * 1.6;
          ctx.beginPath();
          ctx.moveTo(PAD_L, y);
          ctx.lineTo(W - PAD_R, y);
          ctx.stroke();
          ctx.fillStyle = '#0EA5E9';
          ctx.font = 'bold 11px "Plus Jakarta Sans", system-ui, sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(tab.labels[s], PAD_L - 10, y);
        }

        // Notes — only for this row
        for (const col of tab.columns) {
          const colRow = Math.floor(col.time / secondsPerRow);
          if (colRow !== realRow) continue;
          const x = PAD_L + (col.time - rowStartTime) * pps;
          for (let s = 0; s < nStrings; s++) {
            const fret = col.frets[s];
            if (fret == null) continue;
            const y = stringY(displayRow, s, nStrings);
            const until = col.until[s];
            const durSec = until != null ? until - col.time : 0.5;
            const active = t != null && t >= col.time && until != null && t < until;

            // Duration bar
            if (durSec > 0.1) {
              const barLen = durSec * pps;
              ctx.strokeStyle = active ? 'rgba(14,165,233,0.5)' : 'rgba(148,163,184,0.25)';
              ctx.lineWidth = active ? 3 : 2;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(x + NOTE_R * 0.6, y);
              ctx.lineTo(Math.min(x + barLen, W - PAD_R), y);
              ctx.stroke();
              ctx.lineCap = 'butt';
            }

            // Glow when active
            if (active) { ctx.shadowColor = 'rgba(14,165,233,0.8)'; ctx.shadowBlur = 14; }

            // Note circle
            const noteGrad = ctx.createLinearGradient(x - NOTE_R, y - NOTE_R, x + NOTE_R, y + NOTE_R);
            noteGrad.addColorStop(0, active ? '#0EA5E9' : '#0EA5E9');
            noteGrad.addColorStop(1, active ? '#8B5CF6' : '#6366F1');
            ctx.fillStyle = noteGrad;
            ctx.beginPath();
            ctx.arc(x, y, NOTE_R, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Fret number
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(fret), x, y + 0.5);
          }
        }
      }

      // Playhead — only on active display row
      if (t != null && activeRealRow >= 0) {
        const displayActiveRow = rows.indexOf(activeRealRow);
        if (displayActiveRow >= 0) {
          const px = PAD_L + (t - activeRealRow * secondsPerRow) * pps;
          const rTop = displayActiveRow * (ROW_HEIGHT + ROW_GAP);
          ctx.strokeStyle = '#0EA5E9';
          ctx.shadowColor = 'rgba(14,165,233,0.8)';
          ctx.shadowBlur = 6;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(px, rTop + 6);
          ctx.lineTo(px, rTop + ROW_HEIGHT + 6);
          ctx.stroke();
          ctx.fillStyle = '#0EA5E9';
          ctx.beginPath();
          ctx.arc(px, rTop + 6, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, [tab, chords, isPlaying, getTime, zoom]);

  if (tab.columns.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center text-sm" style={{ color: 'var(--ms-muted-light)', background: 'var(--ms-bg-alt)' }}>
        Chưa có nốt nào để dựng tab guitar.
      </div>
    );
  }

  return (
    <canvas ref={canvasRef} className="block w-full" />
  );
}
