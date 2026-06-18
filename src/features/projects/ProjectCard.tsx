import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Project } from './project.types';
import { downloadFile, formatDuration } from '../../shared/lib/utils';
import { base64ToBytes } from '../../shared/lib/encode';

interface ProjectCardProps {
  project: Project;
  index: number;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

/** A single project tile with inline rename, export, and delete. */
export function ProjectCard({ project, index, onRename, onDelete }: ProjectCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(project.name);

  const commit = () => {
    const name = draft.trim();
    if (name && name !== project.name) onRename(project.id, name);
    else setDraft(project.name);
    setEditing(false);
  };

  const stem = project.name.replace(/[\\/:*?"<>|]+/g, '_') || 'project';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.04 }}
      className="glass-card p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(project.name);
                setEditing(false);
              }
            }}
            className="flex-1 min-w-0 rounded-xl border px-3 py-1.5 text-sm font-semibold text-white outline-none"
            style={{
              background: 'var(--bg-glass)',
              borderColor: 'var(--border-glow)',
            }}
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            title="Rename"
            className="flex-1 min-w-0 text-left font-semibold text-white truncate hover:text-aurora-purple transition-colors"
          >
            🎵 {project.name}
          </button>
        )}
        <button
          onClick={() => onDelete(project.id)}
          title="Delete project"
          className="shrink-0 text-white/30 hover:text-aurora-pink transition-colors"
        >
          🗑
        </button>
      </div>

      <div className="text-xs text-white/40">
        {project.noteCount} notes · {formatDuration(project.durationSeconds)}
        {project.audioFileName && <> · 📎 {project.audioFileName}</>}
      </div>
      <div className="text-[11px] text-white/25">
        Updated {new Date(project.updatedAt).toLocaleString('vi-VN')}
      </div>

      <div className="flex gap-2 mt-1">
        <button
          disabled={!project.musicXml}
          onClick={() =>
            project.musicXml &&
            downloadFile(
              project.musicXml,
              `${stem}.musicxml`,
              'application/vnd.recordare.musicxml+xml',
            )
          }
          className="flex-1 glass-btn px-3 py-2 text-xs font-semibold text-white/60 disabled:opacity-30"
        >
          ⬇ XML
        </button>
        <button
          disabled={!project.midiBase64}
          onClick={() =>
            project.midiBase64 &&
            downloadFile(base64ToBytes(project.midiBase64), `${stem}.mid`, 'audio/midi')
          }
          className="flex-1 glass-btn px-3 py-2 text-xs font-semibold text-white/60 disabled:opacity-30"
        >
          ⬇ MIDI
        </button>
      </div>
    </motion.div>
  );
}
