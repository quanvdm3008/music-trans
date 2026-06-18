import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { TranscribePage } from '../pages/TranscribePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <TranscribePage /> },
      { path: 'transcribe', element: <TranscribePage /> },
      { path: 'projects', element: <Navigate to="/" replace /> },
      { path: 'library', element: <Navigate to="/" replace /> },
      { path: 'settings', element: <Navigate to="/" replace /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
