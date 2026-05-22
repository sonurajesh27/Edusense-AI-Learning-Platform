import React from 'react';
import { io } from 'socket.io-client';
import API_URL from '../utils/config.js';

const socket = io(API_URL);

const ControlPanel = ({ isDetecting, setIsDetecting, isCameraOn, onToggleCamera, onClear }) => {
  const handleStartStop = () => {
    if (isCameraOn) {
      setIsDetecting(!isDetecting);
    }
  };

  const handleClear = () => {
    socket.emit('clear-sentence');
    onClear();
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Controls
      </h2>

      <div className="space-y-4">
        {/* Camera Toggle Button */}
        <button
          onClick={onToggleCamera}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
            isCameraOn
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
          }`}
        >
          <div className="flex items-center justify-center space-x-3">
            {isCameraOn ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>Turn Off Camera</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Turn On Camera</span>
              </>
            )}
          </div>
        </button>

        {/* Start/Stop Button */}
        <button
          onClick={handleStartStop}
          disabled={!isCameraOn}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
            !isCameraOn
              ? 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
              : isDetecting
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
          }`}
        >
          <div className="flex items-center justify-center space-x-3">
            {isDetecting ? (
              <>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
                <span>Stop Detection</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span>Start Detection</span>
              </>
            )}
          </div>
        </button>

        {/* Clear Button */}
        <button
          onClick={handleClear}
          className="w-full py-3 px-6 rounded-xl font-semibold bg-white/10 hover:bg-white/20 text-white transition-all duration-300 border border-white/20 flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span>Clear Text</span>
        </button>

        {/* Status Indicator */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/70 text-sm font-medium">Status:</span>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isDetecting ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-white text-sm font-semibold">
                {isDetecting ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-medium">Mode:</span>
            <span className="text-white text-sm font-semibold">ASL (American)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
