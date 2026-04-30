import React from 'react';
import { Toaster } from 'react-hot-toast';
import NotificationSocketBridge from './components/notifications/NotificationSocketBridge';
import Spinner from './components/ui/Spinner';
import AppProviders from './providers/AppProviders';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <AppProviders>
      <NotificationSocketBridge />
      <React.Suspense fallback={<Spinner />}>
        <AppRoutes />
      </React.Suspense>
      <Toaster position="top-right" />
    </AppProviders>
  );
}

export default App;
