import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';

interface WaveformPlayerProps {
  isPlaying: boolean;
  progress: number; // 0–1
  durationSeconds: number;
  hasAudio: boolean;
  onPlayToggle: () => void;
  onSeek: (fraction: number) => void;
  onLoopToggle: () => void;
  loop: boolean;
}

/** Bottom waveform timeline with play/pause/scrub controls. */
export function WaveformPlayer({
  isPlaying,
  progress,
  durationSeconds,
  hasAudio,
  onPlayToggle,
  onSeek,
  onLoopToggle,
  loop,
}: WaveformPlayerProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const currentTime = durationSeconds * progress;

  const handleSeek = useCallback(
    (clientX: number) => {
      if (!barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(fraction);
    },
    [onSeek],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      handleSeek(e.clientX);
    },
    [handleSeek],
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => handleSeek(e.clientX);
    const handleUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, handleSeek]);

  // Fake waveform bars
  const bars = useRef(
    Array.from({ length: 60 }, () => 0.15 + Math.random() * 0.85),
  ).current;

  return (
    <motion.div
      className="glass-panel flex flex-col gap-3 p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Controls row */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <motion.button
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{
            background: 'var(--gradient-btn)',
            boxShadow: 'var(--shadow-glow-purple)',
            opacity: hasAudio ? 1 : 0.4,
          }}
          whileHover={hasAudio ? { scale: 1.08 } : {}}
          whileTap={hasAudio ? { scale: 0.93 } : {}}
          onClick={onPlayToggle}
          disabled={!hasAudio}
        >
          {isPlaying ? '⏸' : '▶'}
        </motion.button>

        {/* Time */}
        <div className="text-xs font-mono text-white/60 min-w-[80px]">
          <span className="text-white/90">{fmtTime(currentTime)}</span>
          <span className="mx-1">/</span>
          <span>{fmtTime(durationSeconds)}</span>
        </div>

        {/* Waveform bar */}
        <div
          ref={barRef}
          className="flex-1 h-12 relative cursor-pointer group rounded-lg overflow-hidden"
          style={{ background: 'var(--bg-glass)' }}
          onMouseDown={handleMouseDown}
        >
          {/* Played portion overlay */}
          <div
            className="absolute inset-y-0 left-0 rounded-lg transition-all duration-75"
            style={{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, rgba(184,77,255,0.3), rgba(77,166,255,0.2))',
              borderRight: '2px solid var(--glow-purple)',
            }}
          />

          {/* Waveform bars */}
          <div className="absolute inset-0 flex items-end justify-around px-1 pb-1 gap-px">
            {bars.map((h, i) => {
              const barProgress = i / bars.length;
              const isPlayed = barProgress <= progress;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all duration-100"
                  style={{
                    height: `${h * 100}%`,
                    background: isPlayed
                      ? 'var(--gradient-aurora)'
                      : 'rgba(255,255,255,0.15)',
                    opacity: isPlayed ? 0.9 : 0.5,
                  }}
                />
              );
            })}
          </div>

          {/* Hover glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          />
        </div>

        {/* Loop toggle */}
        <motion.button
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${loop ? 'aurora-btn' : 'glass-btn'}`}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={onLoopToggle}
          title="Loop"
        >
          🔁
        </motion.button>
      </div>
    </motion.div>
  );
}
