import React from 'react';
import { X, Download, Smartphone } from 'lucide-react';

interface PWAInstallPromptProps {
  show: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  show,
  onInstall,
  onDismiss
}) => {
  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-xl p-4 text-white">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5" />
              <h3 className="font-semibold">Install ClipFlow</h3>
            </div>
            <p className="text-sm text-white/90 mb-3">
              Install our app for faster access and offline features!
            </p>
            <button
              onClick={onInstall}
              className="bg-white text-purple-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
          </div>
          <button
            onClick={onDismiss}
            className="ml-4 text-white/70 hover:text-white transition-colors"
            title="Dismiss install prompt"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
