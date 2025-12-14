import React, { useState } from 'react';
import CameraView from './components/CameraView';
import TextDisplay from './components/TextDisplay';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';

function App() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [recognizedText, setRecognizedText] = useState('');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6">
        <Header />
        
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
      </div>
    </div>
  );
}

export default App;
