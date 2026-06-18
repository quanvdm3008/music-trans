import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjectStore } from '../features/projects/project.store';
import { useThemeStore } from '../core/stores/theme.store';
import { ThemeToggle } from '../components/studio/ThemeToggle';
import { formatDuration } from '../shared/lib/utils';

function storageKB(): number {
  try {
    const raw = localStorage.getItem('skyscore.projects') ?? '';
    return Math.round((raw.length / 1024) * 10) / 10;
  } catch {
    return 0;
  }
}

export function DashboardPage() {
  const { mode: themeMode, setMode } = useThemeStore();
  const projects = useProjectStore((s) => s.projects);
  const totalNotes = projects.reduce((sum, p) => sum + p.noteCount, 0);
  const totalDuration = projects.reduce((sum, p) => sum + p.durationSeconds, 0);
  const recent = projects.slice(0, 4);

  const stats = [
    { icon: '📁', label: 'Projects', value: projects.length },
    { icon: '🎹', label: 'Total Notes', value: totalNotes.toLocaleString('vi-VN') },
    { icon: '⏱', label: 'Duration', value: formatDuration(totalDuration) },
    { icon: '💾', label: 'Storage', value: `${storageKB()} KB` },
  ];

  return (
    <div className="h-full flex flex-col overflow-y-auto studio-scroll p-5 md:p-8">
      {/* Top bar */}
      <header className="flex items-center justify-between mb-8">
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-2xl drop-shadow-[0_0_12px_rgba(184,77,255,0.6)]">🎵</span>
          <div>
            <h1 className="text-xl font-bold glow-text">Aurora Studio</h1>
            <p className="text-xs text-white/40">Your magical music lab</p>
          </div>
        </motion.div>
        <ThemeToggle mode={themeMode} onSelect={setMode} />
      </header>

      {/* Hero CTA */}
      <motion.div
        className="glass-panel-strong p-6 mb-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold glow-text mb-2">
          Transform Music into Magic ✨
        </h2>
        <p className="text-sm text-white/50 mb-5 max-w-lg mx-auto">
          Upload any audio — AI decodes it into MIDI, sheet music, and instrument tracks in real-time.
        </p>
        <Link to="/transcribe">
          <motion.button
            className="aurora-btn px-8 py-3 text-base font-bold inline-flex items-center gap-2"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            🎼 Open Studio
          </motion.button>
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className="glass-card flex items-center gap-3 p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
          >
            <span className="text-3xl">{s.icon}</span>
            <div>
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <motion.div
            className="glass-panel p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Recent Projects</h2>
              <Link to="/projects" className="text-xs font-semibold" style={{ color: 'var(--glow-purple)' }}>
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="text-center py-10 text-white/30 text-sm">
                No projects yet.{' '}
                <Link to="/transcribe" className="font-semibold" style={{ color: 'var(--glow-purple)' }}>
                  Convert your first song!
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {recent.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card p-4"
                  >
                    <div className="font-semibold text-white truncate">🎵 {p.name}</div>
                    <div className="text-xs text-white/40 mt-1">
                      {p.noteCount} notes · {formatDuration(p.durationSeconds)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick actions */}
        <motion.div
          className="glass-panel p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h2 className="font-bold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3">
            <Link to="/transcribe">
              <button className="aurora-btn w-full py-2.5 text-sm font-semibold">🎼 Convert Audio</button>
            </Link>
            <Link to="/projects">
              <button className="glass-btn w-full py-2.5 text-sm font-semibold text-white/70">📁 Projects</button>
            </Link>
            <Link to="/library">
              <button className="glass-btn w-full py-2.5 text-sm font-semibold text-white/70">🎵 Library</button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
