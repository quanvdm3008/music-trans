import { motion } from 'framer-motion';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

type Variant = 'primary' | 'ghost' | 'soft';

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'
>;

interface SkyButtonProps extends NativeButtonProps {
  children: ReactNode;
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-sky-primary to-sky-accent text-white shadow-[0_8px_20px_-8px_rgba(77,175,255,0.7)]',
  soft: 'bg-white/70 text-sky-ink border border-white/80 shadow-[var(--shadow-soft)]',
  ghost: 'bg-transparent text-sky-ink-soft hover:bg-white/50',
};

/** Rounded, soft-shadow button with a gentle press animation. */
export function SkyButton({ children, variant = 'primary', className, ...rest }: SkyButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold',
        'transition-[filter,opacity] hover:brightness-105 disabled:opacity-45 disabled:cursor-not-allowed',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
