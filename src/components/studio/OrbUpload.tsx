import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrbUploadProps {
  onFile: (file: File) => void;
  hasFile: boolean;
  fileName?: string | null;
  isProcessing: boolean;
  disabled?: boolean;
}

/** Central glowing upload orb — the heart of the studio. */
export function OrbUpload({ onFile, hasFile, fileName, isProcessing, disabled }: OrbUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handlePick = useCallback(() => {
    if (!disabled && !isProcessing) inputRef.current?.click();
  }, [disabled, isProcessing]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Orb container */}
      <motion.div
        className="relative cursor-pointer select-none"
        onClick={handlePick}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Outer glow rings */}
        <div
          className="absolute inset-0 rounded-full animate-orb-rotate opacity-40"
          style={{
            background: `conic-gradient(from 0deg, transparent, var(--glow-purple), var(--glow-pink), var(--glow-blue), transparent)`,
            filter: 'blur(20px)',
            transform: 'scale(1.25)',
          }}
        />

        {/* Pulsing glow */}
        <motion.div
          className="absolute inset-0 rounded-full animate-pulse-glow"
          animate={dragOver ? { scale: [1, 1.08, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            background: 'var(--gradient-orb)',
            filter: 'blur(15px)',
            transform: 'scale(1.15)',
          }}
        />

        {/* The orb itself */}
        <motion.div
          className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-full flex flex-col items-center justify-center gap-2"
          style={{
            background: 'var(--bg-glass-strong)',
            backdropFilter: 'blur(20px)',
            border: '1.5px solid var(--border-glow)',
            boxShadow: 'var(--shadow-glow-purple)',
          }}
          animate={
            isProcessing
              ? { scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 1.5 } }
              : dragOver
                ? { scale: 1.06, boxShadow: '0 0 70px rgba(184,77,255,0.6)' }
                : {}
          }
        >
          {/* Inner animated waveform ring */}
          <motion.div
            className="absolute inset-4 rounded-full border border-white/10 animate-wave-morph"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          />

          {/* Icon or status */}
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="text-3xl animate-sparkle">✨</div>
                <span className="text-xs text-white/70 font-medium">Decoding music DNA…</span>
              </motion.div>
            ) : hasFile ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-3xl">🎵</span>
                <span className="text-xs text-white/70 font-medium max-w-[140px] truncate">
                  {fileName ?? 'Audio loaded'}
                </span>
                <span className="text-[10px] text-white/40">Drop new or click</span>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-4xl">🎼</span>
                <span className="text-sm font-semibold text-white/80">Drop audio here</span>
                <span className="text-[10px] text-white/40">MP3, WAV, FLAC, MP4</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*,.mp3,.wav,.flac,.ogg,.m4a,.mp4,.mov,.webm"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Floating note particles on upload */}
      <AnimatePresence>
        {hasFile && !isProcessing && (
          <>
            {['🎶', '🎵', '♪', '♫', '✨'].map((note, i) => (
              <motion.span
                key={i}
                className="absolute text-lg pointer-events-none"
                initial={{
                  opacity: 0,
                  y: 0,
                  x: 0,
                  scale: 0.5,
                }}
                animate={{
                  opacity: [0, 0.8, 0],
                  y: -60 - i * 20,
                  x: (i - 2) * 25,
                  scale: [0.5, 1.2, 0.3],
                }}
                transition={{
                  duration: 2 + i * 0.3,
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: 'easeOut',
                }}
              >
                {note}
              </motion.span>
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
