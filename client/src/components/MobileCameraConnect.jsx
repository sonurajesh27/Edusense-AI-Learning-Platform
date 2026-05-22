import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import API_URL from '../utils/config.js';

const MobileCameraConnect = ({ onStreamReceived, onClose }) => {
  const [connectionUrl, setConnectionUrl] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [mobileDeviceInfo, setMobileDeviceInfo] = useState(null);
  const [networkIP, setNetworkIP] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [publicAccess, setPublicAccess] = useState(false);
  const [ngrokUrl, setNgrokUrl] = useState('');

  useEffect(() => {
    // Generate unique connection ID
    const id = Math.random().toString(36).substring(7);
    setConnectionId(id);

    // Fetch network info and ngrok URL from server
    const fetchNetworkInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/api/network-info`);
        const data = await response.json();
        
        let url;
        
        if (data.ngrokUrl) {
          // Use ngrok URL for public access
          url = `${data.ngrokUrl}/mobile-camera?id=${id}`;
          setPublicAccess(true);
          setNgrokUrl(data.ngrokUrl);
          console.log('🌐 Using ngrok public URL:', url);
        } else {
          // Fallback to local network IP
          const localIP = data.localIP;
          const frontendPort = data.frontendPort;
          url = `http://${localIP}:${frontendPort}/mobile-camera?id=${id}`;
          setNetworkIP(localIP);
          setPublicAccess(false);
          console.log('📡 Using local network URL:', url);
        }
        
        setConnectionUrl(url);
        setIsLoading(false);
        
        console.log('Mobile camera URL:', url);
      } catch (error) {
        console.error('Error fetching network info:', error);
        // Fallback to localhost
        const hostname = window.location.hostname;
        const port = window.location.port || '5173';
        const url = `${window.location.protocol}//${hostname}:${port}/mobile-camera?id=${id}`;
        setConnectionUrl(url);
        setIsLoading(false);
      }
    };
    
    fetchNetworkInfo();

    // Listen for mobile camera connection via Socket.IO
    const socket = window.io && window.io();
    if (socket) {
      socket.on(`mobile-connected-${id}`, (data) => {
        setIsConnected(true);
        setMobileDeviceInfo(data);
      });

      socket.on(`mobile-stream-${id}`, (data) => {
        // Handle incoming video stream from mobile
        if (onStreamReceived) {
          onStreamReceived(data);
        }
      });

      return () => {
        socket.off(`mobile-connected-${id}`);
        socket.off(`mobile-stream-${id}`);
      };
    }
  }, [onStreamReceived]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-lg w-full border-2 border-white/20 shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Connect Mobile Camera
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isConnected ? (
          <>
            {isLoading ? (
              <div className="bg-white rounded-xl p-6 mb-4 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-3"></div>
                <p className="text-gray-700 text-sm font-medium">Getting network info...</p>
              </div>
            ) : (
              <>
                {/* Access Type Badge */}
                {publicAccess ? (
                  <div className="bg-green-500/20 border-2 border-green-500/50 rounded-lg p-3 mb-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-300 text-base sm:text-lg font-bold mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      🌐 PUBLIC INTERNET ACCESS
                    </div>
                    <p className="text-green-200 text-sm mb-2">
                      ✅ Your mobile can connect from ANYWHERE in the world!
                    </p>
                    <div className="bg-green-500/10 rounded-lg p-3 mt-2">
                      <p className="text-green-300 text-xs font-semibold mb-1">
                        ⚡ Powered by Cloudflare Tunnel
                      </p>
                      <p className="text-green-200 text-xs font-mono break-all">
                        {ngrokUrl}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg p-3 mb-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-yellow-300 text-base sm:text-lg font-bold mb-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      📡 LOCAL NETWORK ONLY
                    </div>
                    <p className="text-yellow-200 text-sm mb-2">
                      ⚠️ Phone must be on same WiFi: {networkIP}
                    </p>
                    <div className="bg-yellow-500/10 rounded-lg p-3 mt-2">
                      <p className="text-yellow-300 text-xs mb-2">
                        <strong>💡 Cloudflare Tunnel not active</strong>
                      </p>
                      <p className="text-yellow-200 text-xs">
                        Server is using local network. Restart server to enable public access.
                      </p>
                    </div>
                  </div>
                )}
                
                {/* QR Code Section */}
                <div className="bg-white rounded-xl p-4 sm:p-6 mb-4 flex flex-col items-center">
                  <QRCodeSVG
                    value={connectionUrl}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                  <p className="text-gray-700 text-sm font-medium mt-3 text-center">
                    Scan with your mobile device
                  </p>
                </div>
              </>
            )}

            {/* Instructions */}
            {!isLoading && (
              <div className="bg-white/10 rounded-lg p-4 border border-white/20 mb-4">
                <h3 className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How to Connect:
                </h3>
                <ol className="text-white/80 space-y-1.5 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                    <span>
                      {publicAccess 
                        ? 'Open your mobile camera from ANYWHERE (home, office, cafe, etc.)'
                        : 'Make sure your phone is on the same WiFi network'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                    <span>Open your mobile device's camera or QR code scanner</span>
                  </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                  <span>Scan the QR code displayed above</span>
                </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                    <span>Allow camera access when prompted on your mobile device</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">5</span>
                    <span>Your mobile camera will be connected automatically</span>
                  </li>
                </ol>
              </div>
            )}            {/* Manual URL */}
            {!isLoading && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-white/60 text-xs mb-2">Or enter URL manually:</p>
                <div className="bg-black/30 rounded-md p-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={connectionUrl}
                    readOnly
                    className="flex-1 bg-transparent text-white text-sm outline-none"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(connectionUrl);
                    }}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                >
                  Copy
                </button>
              </div>
              </div>
            )}

            {/* Connection Status */}
            {!isLoading && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="animate-pulse">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                </div>
                <p className="text-white/60 text-xs sm:text-sm">Waiting for connection...</p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Connected State */}
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6 text-center">
              <div className="text-6xl mb-4">✓</div>
              <h3 className="text-2xl font-bold text-white mb-2">Mobile Camera Connected!</h3>
              <p className="text-green-300 mb-4">
                {mobileDeviceInfo?.deviceName || 'Mobile device'} is now streaming
              </p>
              
              {mobileDeviceInfo && (
                <div className="bg-white/10 rounded-lg p-4 text-left">
                  <p className="text-white/80 text-sm mb-1">
                    <strong>Device:</strong> {mobileDeviceInfo.deviceName}
                  </p>
                  <p className="text-white/80 text-sm mb-1">
                    <strong>Browser:</strong> {mobileDeviceInfo.browser}
                  </p>
                  <p className="text-white/80 text-sm">
                    <strong>Resolution:</strong> {mobileDeviceInfo.resolution}
                  </p>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Start Using Mobile Camera
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MobileCameraConnect;
