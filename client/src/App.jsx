import React, { useState, useEffect } from 'react';
import CameraView from './components/CameraView';
import TextDisplay from './components/TextDisplay';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import TouchRead from './components/TouchRead';
import MobileCameraPage from './components/MobileCameraPage';

function App() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [recognizedText, setRecognizedText] = useState('');
  const [mode, setMode] = useState('signLanguage'); // 'signLanguage' or 'touchRead'
  const [isMobileCameraPage, setIsMobileCameraPage] = useState(false);

  // Check if this is the mobile camera page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('id') && window.location.pathname.includes('mobile-camera')) {
      setIsMobileCameraPage(true);
    }
  }, []);

  const handleTextUpdate = (text) => {
    setRecognizedText(text);
  };

  const handleClear = () => {
    setRecognizedText('');
  };

  const handleToggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    if (isDetecting) {
      setIsDetecting(false);
    }
  };

  // If this is mobile camera page, show only that
  if (isMobileCameraPage) {
    return <MobileCameraPage />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6">
        <Header />
        
        {/* Mode Switcher */}
        <div className="flex justify-center gap-4 mt-6 mb-6">
          <button
            onClick={() => setMode('signLanguage')}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
              mode === 'signLanguage'
                ? 'bg-blue-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            Sign Language
          </button>
          <button
            onClick={() => setMode('touchRead')}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
              mode === 'touchRead'
                ? 'bg-purple-500 text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            TouchRead
          </button>
        </div>

        {mode === 'signLanguage' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Main Camera View */}
            <div className="lg:col-span-2 space-y-6">
              {isCameraOn && (
                <CameraView 
                  isDetecting={isDetecting}
                  onTextUpdate={handleTextUpdate}
                />
              )}
              {!isCameraOn && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 shadow-2xl text-center">
                  <div className="text-6xl mb-4">📷</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Camera is Off</h3>
                  <p className="text-white/70">Click "Turn On Camera" to start</p>
                </div>
              )}
              
              <TextDisplay text={recognizedText} />
            </div>

            {/* Control Panel */}
            <div className="lg:col-span-1 space-y-6">
              <ControlPanel 
                isDetecting={isDetecting}
                setIsDetecting={setIsDetecting}
                isCameraOn={isCameraOn}
                onToggleCamera={handleToggleCamera}
                onClear={handleClear}
              />
              
              {/* Instructions Card */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How to Use
                </h3>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                    <span>Allow camera access when prompted</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                    <span>Click "Start Detection" to begin</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                    <span>Show hand signs to the camera</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                    <span>Watch text appear in real-time</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <TouchRead />
        )}
      </div>
    </div>
  );
}

export default App;
