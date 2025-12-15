import React, { useState, useEffect } from 'react';
import CameraView from './components/CameraView';
import TextDisplay from './components/TextDisplay';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import TouchRead from './components/TouchRead';
import MobileCameraPage from './components/MobileCameraPage';
import Login from './components/Login';
import Signup from './components/Signup';
import Sign2Talk from './components/Sign2Talk';
import GamifiedLearning from './components/GamifiedLearning';
import AdminDashboard from './components/AdminDashboard';
import TextToSign from './components/TextToSign';
import ProgressAnalytics from './components/ProgressAnalytics';
import Layout from './components/Layout';

function App() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [recognizedText, setRecognizedText] = useState('');
  const [mode, setMode] = useState('signLanguage'); // Multiple modes now
  const [isMobileCameraPage, setIsMobileCameraPage] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'

  // Check if this is the mobile camera page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('id') && window.location.pathname.includes('mobile-camera')) {
      setIsMobileCameraPage(true);
    }
    
    // Check for existing user session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleSignup = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setMode('signLanguage');
  };

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

  // Show auth screens if user is not logged in
  if (!user) {
    if (authMode === 'login') {
      return <Login onLogin={handleLogin} onSwitchToSignup={() => setAuthMode('signup')} />;
    } else {
      return <Signup onSignup={handleSignup} onSwitchToLogin={() => setAuthMode('login')} />;
    }
  }

  // Main application with layout
  const renderContent = () => {
    switch (mode) {
      case 'sign2talk':
        return <Sign2Talk user={user} />;
      
      case 'gamified':
        return <GamifiedLearning user={user} />;
      
      case 'dashboard':
        return <AdminDashboard user={user} />;
      
      case 'textToSign':
        return <TextToSign user={user} />;
      
      case 'analytics':
        return <ProgressAnalytics userId={user.id} user={user} />;
      
      case 'touchRead':
        return <TouchRead user={user} />;
      
      case 'signLanguage':
      default:
        return (
          <div className="space-y-4 sm:space-y-6">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg">
                    <span className="text-3xl sm:text-4xl">🤟</span>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-bold text-white mb-1">
                      Sign Language to Text
                    </h2>
                    <p className="text-white/70 text-xs sm:text-sm">AI-powered real-time detection and translation</p>
                  </div>
                </div>
                <div className="bg-green-500/20 px-3 sm:px-4 py-2 rounded-full border border-green-500/30 w-fit">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-xs sm:text-sm font-medium">AI Ready</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

            {/* Main Camera View */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {isCameraOn && (
                <CameraView 
                  isDetecting={isDetecting}
                  onTextUpdate={handleTextUpdate}
                />
              )}
              {!isCameraOn && (
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-8 sm:p-12 border border-white/10 shadow-2xl text-center">
                  <div className="text-5xl sm:text-6xl mb-4">📷</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Camera is Off</h3>
                  <p className="text-white/60 text-sm sm:text-base">Click "Turn On Camera" to start detecting</p>
                </div>
              )}
              
              <TextDisplay text={recognizedText} />
            </div>

            {/* Control Panel */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              <ControlPanel 
                isDetecting={isDetecting}
                setIsDetecting={setIsDetecting}
                isCameraOn={isCameraOn}
                onToggleCamera={handleToggleCamera}
                onClear={handleClear}
              />
              
              {/* Instructions Card */}
              <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  Quick Guide
                </h3>
                <ul className="space-y-3 text-white/80 text-sm sm:text-base">
                  <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">1</span>
                    <span>Allow camera access when prompted</span>
                  </li>
                  <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
                    <span>Click "Start Detection" to begin</span>
                  </li>
                  <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">3</span>
                    <span>Show hand signs to the camera</span>
                  </li>
                  <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white">4</span>
                    <span>Watch text appear in real-time</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout}
      currentMode={mode}
      onModeChange={setMode}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
