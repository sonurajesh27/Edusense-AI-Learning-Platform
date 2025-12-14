import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import io from 'socket.io-client';

const MobileCameraPage = () => {
  const webcamRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionId, setConnectionId] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamQuality, setStreamQuality] = useState('high');
  const [connectionError, setConnectionError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const streamIntervalRef = useRef(null);

  useEffect(() => {
    // Get connection ID from URL
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    setConnectionId(id);

    // Connect to server via Socket.IO
    // Determine the correct backend server URL
    let serverUrl;
    
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Local development
      serverUrl = 'http://localhost:5000';
    } else if (window.location.hostname.includes('ngrok')) {
      // ngrok URL - extract and use the backend URL
      // Frontend is on ngrok, backend is on same host but port 5000
      const backendNgrokUrl = window.location.origin.replace(':5173', ':5000');
      serverUrl = backendNgrokUrl;
      console.log('Using ngrok backend URL:', serverUrl);
    } else {
      // Local network IP
      serverUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    }
    
    console.log('Connecting to backend server:', serverUrl);
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setIsLoading(false);
      setConnectionError('');
      
      // Notify server of mobile connection
      const deviceInfo = {
        deviceName: navigator.userAgent.includes('iPhone') ? 'iPhone' : 
                     navigator.userAgent.includes('iPad') ? 'iPad' :
                     navigator.userAgent.includes('Android') ? 'Android Device' : 'Mobile Device',
        browser: navigator.userAgent.match(/(Chrome|Safari|Firefox)/)?.[0] || 'Unknown',
        resolution: `${window.screen.width}x${window.screen.height}`
      };
      
      newSocket.emit('mobile-connected', { connectionId: id, deviceInfo });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setConnectionError('Disconnected from server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsLoading(false);
      setConnectionError('Failed to connect to server. Please check your network connection.');
    });

    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
      newSocket.close();
    };
  }, []);

  const startStreaming = () => {
    setIsStreaming(true);
    
    // Stream video frames to server
    streamIntervalRef.current = setInterval(() => {
      if (webcamRef.current && socket && isConnected) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          socket.emit('mobile-stream', {
            connectionId,
            frame: imageSrc,
            timestamp: Date.now()
          });
        }
      }
    }, streamQuality === 'high' ? 100 : streamQuality === 'medium' ? 200 : 500);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
    }
  };

  const getVideoConstraints = () => {
    const baseConstraints = {
      facingMode: 'environment' // Use rear camera by default
    };

    switch (streamQuality) {
      case 'high':
        return { ...baseConstraints, width: 1920, height: 1080 };
      case 'medium':
        return { ...baseConstraints, width: 1280, height: 720 };
      case 'low':
        return { ...baseConstraints, width: 640, height: 480 };
      default:
        return { ...baseConstraints, width: 1280, height: 720 };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Connecting...</h2>
          <p className="text-white/70">Setting up mobile camera connection</p>
        </div>
      </div>
    );
  }

  // Error state
  if (connectionError && !isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">Connection Failed</h2>
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
            <p className="text-red-300 text-sm">{connectionError}</p>
          </div>
          <div className="text-left bg-white/5 rounded-lg p-4 mb-4">
            <p className="text-white/80 text-sm font-semibold mb-2">Troubleshooting:</p>
            <ul className="text-white/60 text-xs space-y-1 list-disc list-inside">
              <li>Make sure your mobile is on the same WiFi network</li>
              <li>Check if the desktop application is running</li>
              <li>Try refreshing this page</li>
              <li>Scan the QR code again</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-4 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Mobile Camera Stream
          </h1>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <p className="text-white/80">
              {isConnected ? 'Connected to EduSense ✓' : 'Connecting...'}
            </p>
          </div>
        </div>

        {/* Camera View */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-4 border border-white/20">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-4">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={getVideoConstraints()}
              className="w-full h-full object-cover"
            />
            {isStreaming && (
              <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                STREAMING
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Stream Control */}
            <button
              onClick={isStreaming ? stopStreaming : startStreaming}
              disabled={!isConnected}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform active:scale-95 ${
                isStreaming
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isStreaming ? (
                <>
                  <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Stop Streaming
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Streaming
                </>
              )}
            </button>

            {/* Quality Selection */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <label className="text-white font-semibold mb-2 block">Stream Quality</label>
              <div className="grid grid-cols-3 gap-2">
                {['low', 'medium', 'high'].map((quality) => (
                  <button
                    key={quality}
                    onClick={() => {
                      if (isStreaming) {
                        stopStreaming();
                      }
                      setStreamQuality(quality);
                    }}
                    className={`py-2 px-4 rounded-lg font-medium transition-all ${
                      streamQuality === quality
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-white/40 text-xs mt-2">
                {streamQuality === 'high' && '1080p - Best quality, higher data usage'}
                {streamQuality === 'medium' && '720p - Balanced quality and performance'}
                {streamQuality === 'low' && '480p - Lower quality, minimal data usage'}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Usage Tips
          </h3>
          <ul className="text-white/70 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-400">•</span>
              Keep your phone steady for better text recognition
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">•</span>
              Ensure good lighting on the book or document
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">•</span>
              Hold the phone 6-12 inches above the text
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400">•</span>
              Use 'High' quality for best OCR results
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MobileCameraPage;
