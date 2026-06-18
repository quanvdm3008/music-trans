import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Subtle lift + entrance animation. */
  animated?: boolean;
  delay?: number;
}

/** Floating glassmorphism card — the core surface of the SkyScore shell. */
export function GlassCard({ children, className, animated = true, delay = 0 }: GlassCardProps) {
  const base = cn('glass rounded-3xl p-5', className);
  if (!animated) return <div className={base}>{children}</div>;
  return (
    <motion.div
      className={base}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
