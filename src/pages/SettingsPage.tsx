import { motion } from 'framer-motion';
import { useUiStore, VIEW_MODES } from '../core/stores/ui.store';
import { usePlaybackStore } from '../core/stores/playback.store';
import { TUNINGS, useTablatureStore } from '../features/tablature/tablature.store';
import { useProjectStore } from '../features/projects/project.store';
import { INSTRUMENTS } from '../core/audio/player';
import { useThemeStore } from '../core/stores/theme.store';
import { ThemeToggle } from '../components/studio/ThemeToggle';
import { cn } from '../shared/lib/cn';

const SWATCHES = [
  { name: 'Pink', hex: '#ff4da6' },
  { name: 'Purple', hex: '#b84dff' },
  { name: 'Blue', hex: '#4da6ff' },
  { name: 'Cyan', hex: '#4dffd8' },
];

export function SettingsPage() {
  const { viewMode, setViewMode } = useUiStore();
  const { instrument, setInstrument } = usePlaybackStore();
  const { tuning, setTuning } = useTablatureStore();
  const projects = useProjectStore((s) => s.projects);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const { mode: themeMode, setMode } = useThemeStore();

  const clearAll = () => {
    if (confirm(`Delete all ${projects.length} projects? This cannot be undone.`)) {
      projects.forEach((p) => deleteProject(p.id));
    }
  };

  return (
    <div className="h-full overflow-y-auto studio-scroll p-5 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-2xl">⚙️</span>
          <h1 className="text-xl font-bold glow-text">Settings</h1>
        </div>
        <p className="text-xs text-white/40">Customize your studio experience</p>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Display & Playback */}
        <motion.div
          className="glass-panel p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-bold text-white mb-4">🎨 Theme</h2>
          <ThemeToggle mode={themeMode} onSelect={setMode} />

          <h2 className="font-bold text-white mt-6 mb-3">👁 Display Default</h2>
          <label className="block text-[11px] font-semibold text-white/40 mb-2 uppercase tracking-wider">View Mode</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {VIEW_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={cn(
                  'rounded-xl px-3 py-2 text-xs font-semibold transition',
                  viewMode === m.id
                    ? 'aurora-btn'
                    : 'glass-btn text-white/60',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <label className="block text-[11px] font-semibold text-white/40 mb-2 uppercase tracking-wider">Playback Instrument</label>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value as never)}
            className="w-full rounded-xl glass-btn px-3 py-2 text-sm text-white outline-none mb-5"
            style={{ border: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}
          >
            {INSTRUMENTS.map((x) => (
              <option key={x.id} value={x.id} className="bg-[#12002e] text-white">
                {x.label}
              </option>
            ))}
          </select>

          <label className="block text-[11px] font-semibold text-white/40 mb-2 uppercase tracking-wider">Guitar Tuning</label>
          <select
            value={tuning}
            onChange={(e) => setTuning(e.target.value as never)}
            className="w-full rounded-xl glass-btn px-3 py-2 text-sm text-white outline-none"
            style={{ border: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}
          >
            {TUNINGS.map((tn) => (
              <option key={tn.id} value={tn.id} className="bg-[#12002e] text-white">
                {tn.label}
              </option>
            ))}
          </select>
        </motion.div>

        {/* Color palette + Data */}
        <div className="flex flex-col gap-4">
          <motion.div
            className="glass-panel p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="font-bold text-white mb-4">🌈 Aurora Palette</h2>
            <div className="flex gap-3">
              {SWATCHES.map((s) => (
                <div key={s.name} className="text-center">
                  <div
                    className="h-12 w-12 rounded-2xl mb-1.5"
                    style={{
                      background: s.hex,
                      boxShadow: `0 0 20px ${s.hex}40`,
                    }}
                  />
                  <div className="text-[10px] font-semibold text-white/40">{s.name}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="glass-panel p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-bold text-white mb-2">💾 Local Data</h2>
            <p className="text-xs text-white/40 mb-4">
              {projects.length} project{projects.length !== 1 ? 's' : ''} stored in your browser
            </p>
            <button
              onClick={clearAll}
              className="glass-btn px-4 py-2 text-xs font-semibold"
              style={{ color: 'var(--glow-pink)', borderColor: 'rgba(255,77,166,0.3)' }}
            >
              🗑 Clear All Projects
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
