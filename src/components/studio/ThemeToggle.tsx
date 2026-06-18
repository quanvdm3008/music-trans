import { motion } from 'framer-motion';

const THEMES = [
  { id: 'cute' as const, icon: '🌸', label: 'Cute' },
  { id: 'cosmic' as const, icon: '🌌', label: 'Cosmic' },
  { id: 'pro' as const, icon: '⚙️', label: 'Pro' },
];

interface ThemeToggleProps {
  mode: 'cute' | 'cosmic' | 'pro';
  onSelect: (mode: 'cute' | 'cosmic' | 'pro') => void;
}

/** 3-mode theme switcher floating in the top-right corner. */
export function ThemeToggle({ mode, onSelect }: ThemeToggleProps) {
  return (
    <div className="glass-card flex items-center gap-1 p-1 rounded-full">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
          style={{ color: t.id === mode ? 'white' : 'var(--text-muted)' }}
        >
          {t.id === mode && (
            <motion.div
              layoutId="theme-pill"
              className="absolute inset-0 rounded-full aurora-btn"
              style={{ borderRadius: 9999 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{t.icon}</span>
          <span className="relative z-10 hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
