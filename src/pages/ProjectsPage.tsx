import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useProjectStore } from '../features/projects/project.store';
import { ProjectCard } from '../features/projects/ProjectCard';

export function ProjectsPage() {
  const { projects, query, setQuery, renameProject, deleteProject } = useProjectStore();

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="h-full overflow-y-auto studio-scroll p-5 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-2xl">📁</span>
          <h1 className="text-xl font-bold glow-text">Projects</h1>
        </div>
        <p className="text-xs text-white/40">All saved transcriptions (stored locally in your browser)</p>
        <div className="mt-3">
          <Link to="/transcribe">
            <button className="aurora-btn px-5 py-2 text-sm font-semibold">＋ New Conversion</button>
          </Link>
        </div>
      </motion.div>

      <div className="mb-5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Search projects…"
          className="w-full sm:max-w-sm rounded-xl glass-btn px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none"
          style={{ border: '1px solid var(--border-glass)' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center text-white/30">
          {projects.length === 0 ? (
            <>
              No projects yet ✨
              <div className="mt-3">
                <Link to="/transcribe">
                  <button className="aurora-btn px-5 py-2 text-sm font-semibold">🎼 Convert your first song</button>
                </Link>
              </div>
            </>
          ) : (
            'No matching projects found.'
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                onRename={renameProject}
                onDelete={deleteProject}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
