import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProjectStore } from '../features/projects/project.store';
import { downloadFile, formatDuration } from '../shared/lib/utils';
import { base64ToBytes } from '../shared/lib/encode';

/** A flat, export-focused list of everything that's been transcribed. */
export function LibraryPage() {
  const projects = useProjectStore((s) => s.projects);
  const withExports = projects.filter((p) => p.musicXml || p.midiBase64);

  return (
    <div className="h-full overflow-y-auto studio-scroll p-5 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <span className="text-2xl">🎵</span>
          <h1 className="text-xl font-bold glow-text">Library</h1>
        </div>
        <p className="text-xs text-white/40">All exports (MusicXML &amp; MIDI) ready for download</p>
      </motion.div>

      {withExports.length === 0 ? (
        <div className="glass-panel p-12 text-center text-white/30">
          Library is empty.{' '}
          <Link to="/transcribe" className="font-semibold" style={{ color: 'var(--glow-purple)' }}>
            Convert
          </Link>{' '}
          and save a song first.
        </div>
      ) : (
        <motion.div
          className="glass-panel p-2 sm:p-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ul className="divide-y divide-white/8">
            {withExports.map((p, i) => {
              const stem = p.name.replace(/[\\/:*?"<>|]+/g, '_') || 'project';
              return (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-3 py-3"
                >
                  <span className="text-xl">🎼</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white truncate">{p.name}</div>
                    <div className="text-xs text-white/40">
                      {p.noteCount} notes · {formatDuration(p.durationSeconds)}
                    </div>
                  </div>
                  {p.musicXml && (
                    <button
                      className="glass-btn px-3 py-1.5 text-xs font-semibold text-white/70"
                      onClick={() =>
                        downloadFile(
                          p.musicXml!,
                          `${stem}.musicxml`,
                          'application/vnd.recordare.musicxml+xml',
                        )
                      }
                    >
                      ⬇ XML
                    </button>
                  )}
                  {p.midiBase64 && (
                    <button
                      className="glass-btn px-3 py-1.5 text-xs font-semibold text-white/70"
                      onClick={() =>
                        downloadFile(
                          base64ToBytes(p.midiBase64!),
                          `${stem}.mid`,
                          'audio/midi',
                        )
                      }
                    >
                      ⬇ MIDI
                    </button>
                  )}
                </motion.li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
