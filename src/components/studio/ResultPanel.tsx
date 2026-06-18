import { motion, AnimatePresence } from 'framer-motion';

interface TrackInfo {
  name: string;
  icon: string;
  noteCount: number;
  color: string;
}

interface ResultPanelProps {
  tracks: TrackInfo[];
  sheetPages: string[];
  totalNotes: number;
  durationSeconds: number;
  hasResult: boolean;
  isRendering: boolean;
  onDownloadMidi: () => void;
  onDownloadXml: () => void;
  onDownloadPdf: () => void;
}

/** Right panel — decoded MIDI tracks, sheet music preview, downloads. */
export function ResultPanel({
  tracks,
  sheetPages,
  totalNotes,
  durationSeconds,
  hasResult,
  isRendering,
  onDownloadMidi,
  onDownloadXml,
  onDownloadPdf,
}: ResultPanelProps) {
  const fmtDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="glass-panel flex flex-col gap-4 p-5 h-full overflow-y-auto studio-scroll"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div>
        <h2 className="text-base font-bold glow-text">✨ Results</h2>
        <p className="text-[11px] text-white/40 mt-0.5">Your music, decoded</p>
      </div>

      <AnimatePresence mode="wait">
        {!hasResult ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-8"
          >
            <span className="text-5xl opacity-30">🎵</span>
            <p className="text-sm text-white/40 max-w-[180px]">
              Upload audio to see your music transform into visible energy
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-card p-3 text-center">
                <div className="text-lg font-bold text-white">🎹</div>
                <div className="text-lg font-bold text-white">{totalNotes}</div>
                <div className="text-[9px] text-white/40">notes</div>
              </div>
              <div className="glass-card p-3 text-center">
                <div className="text-lg font-bold text-white">⏱</div>
                <div className="text-lg font-bold text-white">{fmtDuration(durationSeconds)}</div>
                <div className="text-[9px] text-white/40">duration</div>
              </div>
              <div className="glass-card p-3 text-center">
                <div className="text-lg font-bold text-white">📄</div>
                <div className="text-lg font-bold text-white">{sheetPages.length}</div>
                <div className="text-[9px] text-white/40">pages</div>
              </div>
            </div>

            {/* Instrument tracks */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Instrument Tracks
              </label>
              {tracks.map((track, i) => (
                <motion.div
                  key={track.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card flex items-center gap-3 p-3"
                  style={{ borderLeft: `2px solid ${track.color}` }}
                >
                  <span className="text-xl">{track.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{track.name}</div>
                    <div className="text-[10px] text-white/40">{track.noteCount} notes</div>
                  </div>
                  <div
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${track.color}20`, color: track.color }}
                  >
                    MIDI
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Sheet music thumbnail */}
            {sheetPages.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Sheet Music Preview
                </label>
                <div
                  className="glass-card p-2 overflow-hidden flex justify-center"
                  style={{ maxHeight: 180 }}
                >
                  <div
                    className="w-full scale-[0.35] origin-top"
                    style={{ filter: 'invert(0.9) hue-rotate(180deg) brightness(1.2)' }}
                    dangerouslySetInnerHTML={{ __html: sheetPages[0] ?? '' }}
                  />
                </div>
              </div>
            )}

            {isRendering && (
              <div className="text-center text-xs text-white/40 animate-pulse">
                Rendering sheet music…
              </div>
            )}

            {/* Downloads */}
            <div className="flex gap-2 mt-1">
              <button onClick={onDownloadMidi} className="glass-btn flex-1 py-2 text-xs font-semibold text-white/80">
                ⬇ MIDI
              </button>
              <button onClick={onDownloadXml} className="glass-btn flex-1 py-2 text-xs font-semibold text-white/80">
                ⬇ MusicXML
              </button>
              <button onClick={onDownloadPdf} className="glass-btn flex-1 py-2 text-xs font-semibold text-white/80">
                ⬇ PDF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
