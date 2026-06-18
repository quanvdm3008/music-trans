import { SheetMusic } from './components/SheetMusic';
import { TabView } from '../tablature/TabView';
import type { NoteEventTime } from '../../core/music/note-event';
import type { ViewMode } from '../../core/stores/ui.store';

interface ResultViewProps {
  viewMode: ViewMode;
  svgPages: string[] | null;
  rendering: boolean;
  notes: NoteEventTime[];
  isPlaying: boolean;
  getTime: () => number | null;
}

/** Renders the result according to the chosen view mode (sheet / tab / violin). */
export function ResultView({
  viewMode,
  svgPages,
  rendering,
  notes,
  isPlaying,
  getTime,
}: ResultViewProps) {
  const sheet =
    svgPages && svgPages.length > 0 ? (
      <SheetMusic pages={svgPages} />
    ) : (
      !rendering && <div className="placeholder no-print">Chưa có bản nhạc.</div>
    );

  if (viewMode === 'sheet') return <>{sheet}</>;
  // tab or violin — both show TabView
  return <TabView notes={notes} isPlaying={isPlaying} getTime={getTime} />;
}
