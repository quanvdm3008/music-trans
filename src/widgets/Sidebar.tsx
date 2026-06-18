import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../shared/lib/cn';

const NAV = [
  { to: '/', label: 'Tổng quan', icon: '🏠', end: true },
  { to: '/transcribe', label: 'Chuyển đổi', icon: '🎼', end: false },
  { to: '/projects', label: 'Dự án', icon: '📁', end: false },
  { to: '/library', label: 'Thư viện', icon: '🎵', end: false },
  { to: '/settings', label: 'Cài đặt', icon: '⚙️', end: false },
];

/** Left navigation rail — floating glass with the SkyScore identity. */
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col gap-2 p-4">
      <div className="flex items-center gap-2.5 px-2 py-4">
        <span className="text-3xl drop-shadow-[0_4px_10px_rgba(77,175,255,0.5)]">☁️</span>
        <div className="leading-tight">
          <div className="font-bold text-lg text-sky-ink">SkyScore</div>
          <div className="text-[11px] tracking-wide text-sky-muted font-semibold">AI · V1</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 mt-2">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 3 }}
                className={cn(
                  'relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
                  isActive
                    ? 'text-sky-primary glass'
                    : 'text-sky-ink-soft hover:bg-white/40',
                )}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-dot"
                    className="absolute right-3 h-2 w-2 rounded-full bg-sky-primary shadow-[0_0_8px_rgba(77,175,255,0.8)]"
                  />
                )}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-3 py-4 text-[11px] text-sky-muted leading-relaxed">
        Bản nháp AI — tinh chỉnh cuối trong MuseScore.
      </div>
    </aside>
  );
}
