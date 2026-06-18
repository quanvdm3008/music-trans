import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
}

/** Consistent page title block for the SkyScore shell. */
export function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-wrap items-end justify-between gap-4 mb-6"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-sky-ink flex items-center gap-3">
          {icon && <span className="text-3xl">{icon}</span>}
          <span className="bg-gradient-to-r from-sky-primary via-sky-accent to-sky-pink bg-clip-text text-transparent">
            {title}
          </span>
        </h1>
        {subtitle && <p className="mt-1.5 text-sky-muted text-sm max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
