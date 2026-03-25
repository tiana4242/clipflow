import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-amber-500/90 border border-amber-600 rounded-lg p-3 shadow-lg z-50">
      <div className="flex items-center gap-2 text-white">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">You're offline</p>
          <p className="text-xs opacity-90">Some features may be unavailable</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex-shrink-0 p-1 hover:bg-amber-600 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
