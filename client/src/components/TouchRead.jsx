import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import Tesseract from 'tesseract.js';
import MobileCameraConnect from './MobileCameraConnect';

const TouchRead = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [handModel, setHandModel] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [detectedText, setDetectedText] = useState('');
  const [fingerPosition, setFingerPosition] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [showMobileConnect, setShowMobileConnect] = useState(false);
  const [mobileStreamData, setMobileStreamData] = useState(null);
  const [useMobileCamera, setUseMobileCamera] = useState(false);
  const [isCameraSwitching, setIsCameraSwitching] = useState(false);
  const detectionIntervalRef = useRef(null);
  const lastOcrTime = useRef(0);
  const speechSynthesis = window.speechSynthesis;

  // Load available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        
        if (videoDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
        
        console.log('Available cameras:', videoDevices);
      } catch (error) {
        console.error('Error enumerating devices:', error);
      }
    };
    
    getCameras();
    
    // Request permissions first to get device labels
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => getCameras())
      .catch(console.error);
  }, []);

  // Load hand detection model
  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const model = await handpose.load();
        setHandModel(model);
        console.log('Hand tracking model loaded for TouchRead');
      } catch (error) {
        console.error('Error loading hand model:', error);
      }
    };
    loadModel();

    return () => {
      if (handModel) {
        handModel.dispose();
      }
    };
  }, []);

  // Start reading detection
  useEffect(() => {
    if (isReading && handModel) {
      startDetection();
    } else {
      stopDetection();
    }
    return () => stopDetection();
  }, [isReading, handModel]);

  const startDetection = () => {
    detectionIntervalRef.current = setInterval(async () => {
      await detectFingerAndRead();
    }, 200);
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const detectFingerAndRead = async () => {
    // Don't run detection during camera switch
    if (isCameraSwitching) return;
    
    if (webcamRef.current && webcamRef.current.video.readyState === 4 && handModel) {
      const video = webcamRef.current.video;
      const predictions = await handModel.estimateHands(video);

      if (predictions.length > 0) {
        const hand = predictions[0];
        const indexFingerTip = hand.landmarks[8]; // Index finger tip
        
        setFingerPosition({ x: indexFingerTip[0], y: indexFingerTip[1] });
        
        // Draw finger position
        drawFingerPointer(indexFingerTip);
        
        // Capture area around finger for OCR
        captureTextAreaAroundFinger(indexFingerTip);
      } else {
        clearCanvas();
        setFingerPosition(null);
      }
    }
  };

  const drawFingerPointer = (fingerTip) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw circle at finger tip
    ctx.beginPath();
    ctx.arc(fingerTip[0], fingerTip[1], 15, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fill();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw reading zone
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(fingerTip[0] - 100, fingerTip[1] - 50, 200, 100);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const captureTextAreaAroundFinger = async (fingerTip) => {
    if (!webcamRef.current) return;
    
    const video = webcamRef.current.video;
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    // Set capture area dimensions
    const captureWidth = 400;
    const captureHeight = 200;
    const x = Math.max(0, fingerTip[0] - captureWidth / 2);
    const y = Math.max(0, fingerTip[1] - captureHeight / 2);
    
    tempCanvas.width = captureWidth;
    tempCanvas.height = captureHeight;
    
    // Draw the video frame area around finger
    ctx.drawImage(
      video,
      x, y, captureWidth, captureHeight,
      0, 0, captureWidth, captureHeight
    );
    
    const imageData = tempCanvas.toDataURL('image/png');
    setCapturedImage(imageData);
    
    // Simulate OCR (In production, you would use Tesseract.js or Google Vision API)
    performOCR(imageData);
  };

  const performOCR = async (imageData) => {
    // Throttle OCR to every 2 seconds to avoid performance issues
    const now = Date.now();
    if (now - lastOcrTime.current < 2000) {
      return;
    }
    lastOcrTime.current = now;

    try {
      setIsProcessing(true);
      setOcrProgress(0);

      // Perform OCR using Tesseract.js
      const result = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const extractedText = result.data.text.trim();
      
      if (extractedText && extractedText.length > 0) {
        setDetectedText(extractedText);
      } else {
        setDetectedText('No text detected in this area. Try pointing at clearer text.');
      }
      
      setIsProcessing(false);
      setOcrProgress(0);
    } catch (error) {
      console.error('OCR Error:', error);
      setDetectedText('Error reading text. Please try again.');
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  const speakText = (text) => {
    if (!text) return;
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
  };

  const handleCameraChange = (deviceId) => {
    console.log('Switching to camera:', deviceId);
    
    setIsCameraSwitching(true);
    
    // Stop detection first
    const wasReading = isReading;
    if (isReading) {
      setIsReading(false);
      stopDetection();
    }
    
    // Clear canvas
    clearCanvas();
    setFingerPosition(null);
    setDetectedText('');
    setCapturedImage(null);
    
    // Update camera
    setSelectedDeviceId(deviceId);
    setShowDeviceSelector(false);
    setUseMobileCamera(false);
    
    // Wait for camera to initialize
    setTimeout(() => {
      setIsCameraSwitching(false);
      
      // Restart detection after camera switch
      if (wasReading) {
        setTimeout(() => {
          setIsReading(true);
        }, 500);
      }
    }, 1000); // Give camera time to initialize
  };

  const handleMobileStreamReceived = (streamData) => {
    setMobileStreamData(streamData);
    setUseMobileCamera(true);
    setIsCameraOn(true);
  };

  const handleMobileConnectClose = () => {
    setShowMobileConnect(false);
  };

  // Close device selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDeviceSelector && !event.target.closest('.camera-selector')) {
        setShowDeviceSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDeviceSelector]);

  // Handle camera device changes
  useEffect(() => {
    if (selectedDeviceId && webcamRef.current) {
      console.log('Camera device changed to:', selectedDeviceId);
    }
  }, [selectedDeviceId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3 flex items-center justify-center gap-2 md:gap-3">
            <svg className="w-8 h-8 md:w-10 lg:w-12 md:h-10 lg:h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="hidden sm:inline">TouchRead - Finger-Guided Reading</span>
            <span className="sm:hidden">TouchRead</span>
          </h1>
          <p className="text-white/80 text-sm md:text-base lg:text-lg px-4">Point your finger at text to read it aloud</p>
        </div>

        {/* Control Panel */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-6 mb-4 md:mb-6 border border-white/20">
          <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-center">
            <button
              onClick={() => setIsReading(!isReading)}
              className={`flex-1 sm:flex-none px-4 sm:px-6 md:px-8 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base lg:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg ${
                isReading
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isReading ? (
                <>
                  <svg className="w-5 h-5 md:w-6 md:h-6 inline mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  <span className="hidden sm:inline">Stop Reading</span>
                  <span className="sm:hidden">Stop</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 md:w-6 md:h-6 inline mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Start Reading</span>
                  <span className="sm:hidden">Start</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                setIsCameraOn(!isCameraOn);
                if (isReading) setIsReading(false);
              }}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg ${
                isCameraOn
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 inline mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isCameraOn ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                ) : (
                  <>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </>
                )}
              </svg>
              <span className="hidden md:inline">{isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}</span>
              <span className="md:hidden">{isCameraOn ? 'Off' : 'On'}</span>
            </button>

            <button
              onClick={() => setShowMobileConnect(true)}
              className="w-full sm:w-auto px-4 sm:px-6 py-3 md:py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6 inline mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span className="hidden sm:inline">📱 Connect Mobile Camera</span>
              <span className="sm:hidden">📱 Mobile</span>
            </button>

            {devices.length > 1 && (
              <>
                {/* Mobile backdrop overlay */}
                {showDeviceSelector && (
                  <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] sm:hidden"
                    onClick={() => setShowDeviceSelector(false)}
                  />
                )}
                
                <div className="relative camera-selector w-full sm:w-auto">
                  <button
                    onClick={() => setShowDeviceSelector(!showDeviceSelector)}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 md:py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6 inline mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="hidden sm:inline">Switch Camera ({devices.length})</span>
                    <span className="sm:hidden">Camera ({devices.length})</span>
                  </button>
                  
                  {showDeviceSelector && (
                  <div className="fixed sm:absolute top-auto bottom-0 sm:top-full sm:bottom-auto left-0 right-0 sm:left-0 sm:right-auto bg-gray-800 rounded-t-lg sm:rounded-lg shadow-2xl border border-white/20 z-[9999] sm:min-w-[300px] max-h-[50vh] overflow-y-auto">
                    <div className="p-2">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 sm:border-0">
                        <div className="text-white/60 text-xs font-semibold uppercase">
                          Select Camera Device
                        </div>
                        <button
                          onClick={() => setShowDeviceSelector(false)}
                          className="sm:hidden text-white/60 hover:text-white transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      {devices.map((device, index) => (
                        <button
                          key={device.deviceId}
                          onClick={() => handleCameraChange(device.deviceId)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                            selectedDeviceId === device.deviceId
                              ? 'bg-indigo-500 text-white'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1">
                            <div className="font-medium">
                              {device.label || `Camera ${index + 1}`}
                            </div>
                            {selectedDeviceId === device.deviceId && (
                              <div className="text-xs text-white/60 mt-0.5">Currently Active</div>
                            )}
                          </div>
                          {selectedDeviceId === device.deviceId && (
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </>
            )}

            {detectedText && (
              <>
                <button
                  onClick={() => speakText(detectedText)}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-3 md:py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 inline mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <span className="hidden sm:inline">Read Aloud</span>
                  <span className="sm:hidden">🔊 Read</span>
                </button>
                <button
                  onClick={stopSpeaking}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-3 md:py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg md:rounded-xl font-semibold text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6 inline mr-1 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                  <span className="hidden sm:inline">Stop Audio</span>
                  <span className="sm:hidden">⏹️ Stop</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Camera View */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 md:mb-4 gap-2">
              <h3 className="text-white text-base md:text-lg lg:text-xl font-semibold flex items-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Live Camera Feed</span>
                <span className="sm:hidden">Camera</span>
              </h3>
              {isCameraOn && devices.length > 0 && (
                <div className="bg-indigo-500/20 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-indigo-500/30">
                  <p className="text-indigo-300 text-xs font-medium truncate max-w-[200px] sm:max-w-none">
                    📹 {devices.find(d => d.deviceId === selectedDeviceId)?.label || 'Camera Active'}
                  </p>
                </div>
              )}
            </div>
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              {isCameraOn && (
                <Webcam
                  key={selectedDeviceId} // Force remount when camera changes
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/png"
                  className="w-full h-full object-cover"
                  mirrored={true}
                  videoConstraints={{
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: undefined // Let deviceId take precedence
                  }}
                  onUserMediaError={(error) => {
                    console.error('Camera error:', error);
                  }}
                />
              )}
              
              {isCameraOn && (
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={480}
                  className="absolute top-0 left-0 w-full h-full"
                />
              )}
              
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📷</div>
                    <p className="text-white text-2xl font-bold mb-2">Camera is Off</p>
                    <p className="text-white/60 text-lg">Click "Turn On Camera" to start</p>
                  </div>
                </div>
              )}
              
              {!isReading && isCameraOn && !isCameraSwitching && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <div className="text-center">
                    <svg className="w-16 h-16 text-white/60 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-white text-lg font-medium">Reading Paused</p>
                    <p className="text-white/60 text-sm mt-2">Click "Start Reading" to begin</p>
                  </div>
                </div>
              )}
              
              {isCameraSwitching && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-white text-lg font-medium">Switching Camera...</p>
                    <p className="text-white/60 text-sm mt-2">Please wait</p>
                  </div>
                </div>
              )}
            </div>
            
            {fingerPosition && isCameraOn && (
              <div className="mt-2 md:mt-3 text-center">
                <span className="inline-block bg-green-500/20 text-green-300 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium border border-green-500/30">
                  ✓ Finger Detected
                  <span className="hidden sm:inline"> - Position: ({Math.round(fingerPosition.x)}, {Math.round(fingerPosition.y)})</span>
                </span>
              </div>
            )}

            {isProcessing && (
              <div className="mt-2 md:mt-3">
                <div className="bg-blue-500/20 rounded-lg p-2 md:p-3 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-300 text-sm font-medium">Reading text from book...</span>
                    <span className="text-blue-300 text-sm font-bold">{ocrProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 transition-all duration-300"
                      style={{ width: `${ocrProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Text Display */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-6 border border-white/20">
            <h3 className="text-white text-base md:text-lg lg:text-xl font-semibold mb-3 md:mb-4 flex items-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Detected Text
            </h3>
            
            <div className="bg-white/5 rounded-xl p-3 md:p-6 min-h-[250px] md:min-h-[400px] border border-white/10">
              {detectedText ? (
                <div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 md:p-3 mb-3 md:mb-4">
                    <div className="flex items-center gap-2 text-green-300 text-xs md:text-sm font-medium mb-1">
                      <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Text extracted from book
                    </div>
                  </div>
                  
                  <p className="text-white text-sm md:text-base lg:text-lg leading-relaxed mb-3 md:mb-4 p-3 md:p-4 bg-white/5 rounded-lg border border-white/10 max-h-[300px] md:max-h-none overflow-y-auto">
                    {detectedText}
                  </p>
                  
                  {capturedImage && (
                    <div className="mt-3 md:mt-4">
                      <p className="text-white/70 text-xs md:text-sm mb-2 font-medium">Captured Area from Book:</p>
                      <img 
                        src={capturedImage} 
                        alt="Captured text area from book" 
                        className="rounded-lg border-2 border-purple-500/30 max-w-full shadow-lg"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/50 py-4">
                  <svg className="w-12 h-12 md:w-16 lg:w-20 md:h-16 lg:h-20 mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="text-base md:text-lg font-medium mb-2">📖 No text detected yet</p>
                  <p className="text-xs md:text-sm text-center mb-3 md:mb-4 px-4">Place a book with clear text in front of the camera</p>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 md:p-4 max-w-md w-full mx-4">
                    <p className="text-yellow-300 text-xs md:text-sm">
                      <strong>💡 Tips for best results:</strong>
                    </p>
                    <ul className="text-white/60 text-xs mt-2 space-y-1 list-disc list-inside">
                      <li>Use good lighting</li>
                      <li>Point at printed text (not screens)</li>
                      <li>Keep text steady and in focus</li>
                      <li>Use books with clear, large fonts</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
            <svg className="w-6 h-6 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to Use TouchRead
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white/80">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-3xl mb-2">�</div>
              <p className="text-sm"><strong>Option:</strong> Connect your mobile camera for better quality</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-3xl mb-2">�📖</div>
              <p className="text-sm"><strong>Step 1:</strong> Place a book or document in front of the camera</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-3xl mb-2">👆</div>
              <p className="text-sm"><strong>Step 2:</strong> Point your index finger at the text you want to read</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="text-3xl mb-2">🔊</div>
              <p className="text-sm"><strong>Step 3:</strong> Click "Read Aloud" to hear the text</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Camera Connect Modal */}
      {showMobileConnect && (
        <MobileCameraConnect
          onStreamReceived={handleMobileStreamReceived}
          onClose={handleMobileConnectClose}
        />
      )}
    </div>
  );
};

export default TouchRead;
