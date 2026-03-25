import React from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, showInstallPrompt, install, dismissInstallPrompt } = usePWA();

  if (!isInstallable || !showInstallPrompt) return null;

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      console.log('App installed successfully!');
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-xl z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-white mb-1">
            Install ClipFlow
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Get the full app experience with offline support and faster loading.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Download className="w-3 h-3" />
              Install
            </button>
            
            <button
              onClick={dismissInstallPrompt}
              className="text-slate-400 hover:text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        
        <button
          onClick={dismissInstallPrompt}
          className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
          title="Dismiss install prompt"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
