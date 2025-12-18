import React, { useState, useEffect } from 'react';
import gestureDataCollector from '../utils/gestureDataCollector';

const GestureStatsViewer = ({ isVisible = false }) => {
  const [stats, setStats] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const updateStats = () => {
        const currentStats = gestureDataCollector.getGestureStats();
        setStats(currentStats);
      };

      updateStats();
      const interval = setInterval(updateStats, 5000); // Update every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-full p-2 text-blue-300 text-xs font-medium transition-all backdrop-blur-md"
        title="View Learning Stats"
      >
        📊 {stats?.sessionGestures || 0}
      </button>

      {isOpen && stats && (
        <div className="absolute bottom-12 right-0 bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-lg p-4 w-64 shadow-xl">
          <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            🧠 Learning Progress
            <button
              onClick={() => setIsOpen(false)}
              className="ml-auto text-white/60 hover:text-white text-xs"
            >
              ✕
            </button>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/70">Session:</span>
              <span className="text-white font-mono">{stats.sessionGestures}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">Total:</span>
              <span className="text-white font-mono">{stats.totalGestures}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/70">Hand Size:</span>
              <span className="text-white font-mono">{stats.handSize || 'unknown'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-white/70">Accuracy:</span>
              <span className="text-white font-mono">{(stats.averageAccuracy * 100).toFixed(1)}%</span>
            </div>

            {stats.topSigns.length > 0 && (
              <div className="mt-3 pt-2 border-t border-white/20">
                <div className="text-white/70 mb-1">Top Signs:</div>
                <div className="space-y-1">
                  {stats.topSigns.slice(0, 3).map(([sign, data]) => (
                    <div key={sign} className="flex justify-between">
                      <span className="text-white/80 uppercase">{sign}</span>
                      <span className="text-green-400 font-mono text-xs">
                        {data.successful}/{data.attempts}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 pt-2 border-t border-white/20 text-[10px] text-white/50">
              Data is used to improve recognition accuracy for your hand gestures
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestureStatsViewer;
