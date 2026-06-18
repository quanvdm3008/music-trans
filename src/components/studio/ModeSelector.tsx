import { motion } from 'framer-motion';

interface ModeSelectorProps {
  value: string;
  onChange: (mode: string) => void;
  disabled?: boolean;
}

const MODES = [
  { id: 'basic-pitch', icon: '🎹', label: 'Basic Pitch', desc: 'General transcription' },
  { id: 'midi', icon: '🎛️', label: 'MIDI Extract', desc: 'Pure MIDI notes' },
  { id: 'sheet', icon: '🎼', label: 'Sheet Music', desc: 'Full notation score' },
  { id: 'separation', icon: '🎸', label: 'Instrument Split', desc: 'Separate stems' },
];

/** Mode selector with cute glowing cards. */
export function ModeSelector({ value, onChange, disabled }: ModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
        Processing Mode
      </label>
      <div className="grid grid-cols-2 gap-2">
        {MODES.map((mode) => {
          const active = value === mode.id;
          return (
            <motion.button
              key={mode.id}
              onClick={() => !disabled && onChange(mode.id)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.03, y: -1 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              className="relative flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-all duration-300"
              style={{
                background: active
                  ? 'var(--bg-glass-strong)'
                  : 'var(--bg-glass)',
                border: active
                  ? '1px solid var(--border-glow)'
                  : '1px solid var(--border-glass)',
                boxShadow: active ? 'var(--shadow-glow-purple)' : 'none',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              {active && (
                <motion.div
                  layoutId="mode-highlight"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(184,77,255,0.1), rgba(77,166,255,0.05))',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="text-xl relative z-10">{mode.icon}</span>
              <span
                className="text-[11px] font-semibold relative z-10"
                style={{ color: active ? 'white' : 'var(--text-secondary)' }}
              >
                {mode.label}
              </span>
              <span className="text-[9px] text-white/30 relative z-10">{mode.desc}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
