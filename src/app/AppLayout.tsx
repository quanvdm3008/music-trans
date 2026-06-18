import { Outlet } from 'react-router-dom';

/** Clean, minimal app shell for MelodyScribe — scrollable single-page layout. */
export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <main>
        <Outlet />
      </main>
    </div>
  );
}
