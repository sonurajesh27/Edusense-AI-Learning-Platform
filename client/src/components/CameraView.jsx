import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import * as fp from 'fingerpose';
import { allGestures, handShapes, aslDescriptions } from '../utils/aslGestures';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const CameraView = ({ isDetecting, onTextUpdate }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const handCanvasRef = useRef(null); // canvas for hand visualization
  const [detector, setDetector] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [currentSign, setCurrentSign] = useState('');
  const [confidence, setConfidence] = useState(0);
  const detectionIntervalRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const [handLandmarks, setHandLandmarks] = useState(null);
  
  // Gesture stabilization - wait for consistent detection
  const gestureHistoryRef = useRef([]);
  const lastGestureTimeRef = useRef(0);
  const gestureStableCountRef = useRef(0);
  const GESTURE_STABILITY_THRESHOLD = 8; // Need 8 consistent frames for more accuracy
  const GESTURE_COOLDOWN = 3000; // 3 seconds freeze between gesture captures

  // Sign language alphabet mapping (simplified version)
  const signMapping = {
    'fist': 'A',
    'peace': 'V',
    'thumbsup': 'Good',
    'open': 'Hello',
    'pointing': 'I',
    'ok': 'OK'
  };

  useEffect(() => {
    const loadHandPoseModel = async () => {
      try {
        await tf.ready();
        const model = await handpose.load();
        setDetector(model);
        console.log('Hand pose detection model loaded');
      } catch (error) {
        console.error('Error loading hand pose model:', error);
      }
    };

    loadHandPoseModel();

    return () => {
      if (detector) {
        detector.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (isDetecting && detector && cameraReady) {
      startDetection();
    } else {
      stopDetection();
    }

    return () => stopDetection();
  }, [isDetecting, detector, cameraReady]);

  const startDetection = () => {
    detectionIntervalRef.current = setInterval(async () => {
      await detectHands();
    }, 200); // Detect every 200ms (slower for better stability)
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const detectHands = async () => {
    if (
      webcamRef.current &&
      webcamRef.current.video.readyState === 4 &&
      detector
    ) {
      const video = webcamRef.current.video;
      const predictions = await detector.estimateHands(video);
      
      if (!predictions || predictions.length === 0) {
        clearCanvas();
        clearHandCanvas();
        setHandLandmarks(null);
        setCurrentSign('No hand detected');
        setConfidence(0);
        return;
      }
      
      const hands = predictions.map(pred => ({ 
        keypoints: pred.landmarks.flat().map((coord) => ({ 
          x: coord[0], 
          y: coord[1], 
          z: coord[2] || 0 
        })) 
      }));

      if (hands.length > 0) {
        const firstHand = hands[0];
        drawHands(hands);
        drawHandSkeleton(predictions[0].landmarks); // Draw skeleton on separate canvas
        setHandLandmarks(firstHand); // Store for visualization
        
        const detectedSign = classifyHandGesture(predictions);
        
        if (detectedSign && detectedSign.confidence > 0.65) {
          // Add to gesture history
          gestureHistoryRef.current.push(detectedSign.sign);
          if (gestureHistoryRef.current.length > 10) {
            gestureHistoryRef.current.shift(); // Keep only last 10
          }

          // Check if gesture is stable (same gesture for multiple frames)
          const recentGestures = gestureHistoryRef.current.slice(-GESTURE_STABILITY_THRESHOLD);
          const isStable = recentGestures.every(g => g === detectedSign.sign);
          
          // Check cooldown period
          const now = Date.now();
          const canCapture = (now - lastGestureTimeRef.current) > GESTURE_COOLDOWN;
          
          if (isStable && canCapture) {
            // Gesture is stable and cooldown passed - capture it!
            setCurrentSign(`✓ ${detectedSign.sign}`);
            setConfidence(detectedSign.confidence);
            lastGestureTimeRef.current = now;
            gestureStableCountRef.current = 0;

            // Send to server via Socket.IO
            socket.emit('sign-detected', {
              sign: detectedSign.sign,
              confidence: detectedSign.confidence
            });

            // Update text display
            onTextUpdate(prev => prev + detectedSign.sign + ' ');
          } else {
            // Show current detection but don't capture yet
            const countdown = Math.max(0, GESTURE_COOLDOWN - (now - lastGestureTimeRef.current)) / 1000;
            if (isStable && countdown > 0) {
              setCurrentSign(`⏳ ${detectedSign.sign} (${countdown.toFixed(1)}s)`);
            } else {
              setCurrentSign(`👁️ ${detectedSign.sign} (${recentGestures.filter(g => g === detectedSign.sign).length}/${GESTURE_STABILITY_THRESHOLD})`);
            }
            setConfidence(detectedSign.confidence);
          }
        } else {
          setCurrentSign(detectedSign ? `Detecting... (${(detectedSign.confidence * 100).toFixed(0)}%)` : 'Move hand clearly');
          setConfidence(detectedSign?.confidence || 0);
        }
      } else {
        clearCanvas();
        clearHandCanvas();
        setHandLandmarks(null);
        setCurrentSign('No hand detected');
        setConfidence(0);
        gestureHistoryRef.current = []; // Reset history when no hand
      }
    }
  };

  const classifyHandGesture = (predictions) => {
    if (!predictions || predictions.length === 0) return null;
    
    // Use fingerpose for gesture recognition
    const GE = new fp.GestureEstimator(allGestures);
    const gesture = GE.estimate(predictions[0].landmarks, 7.5);
    
    if (gesture.gestures && gesture.gestures.length > 0) {
      // Sort by confidence and get the best match
      const bestGesture = gesture.gestures.reduce((prev, current) => 
        (current.score > prev.score) ? current : prev
      );
      
      return {
        sign: bestGesture.name,
        confidence: bestGesture.score
      };
    }
    
    // Fallback to basic detection
    const keypoints = predictions[0].landmarks.flat().map((coord, i) => ({ 
      x: coord[0], 
      y: coord[1], 
      z: coord[2] || 0 
    }));
    
    return classifyHandGestureBasic({ keypoints });
  };

  const classifyHandGestureBasic = (hand) => {
    // Fallback gesture classification based on landmarks
    const keypoints = hand.keypoints;
    
    if (!keypoints || keypoints.length < 21) return null;

    // Get key landmarks
    const wrist = keypoints[0];
    const thumbTip = keypoints[4];
    const thumbIP = keypoints[3];
    const indexTip = keypoints[8];
    const indexPIP = keypoints[6];
    const middleTip = keypoints[12];
    const middlePIP = keypoints[10];
    const ringTip = keypoints[16];
    const ringPIP = keypoints[14];
    const pinkyTip = keypoints[20];
    const pinkyPIP = keypoints[18];

    // Helper function to calculate distance
    const distance = (p1, p2) => {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    };

    // Count extended fingers with better detection
    const fingers = [];
    
    // Thumb (horizontal check - compare x positions)
    const thumbExtended = Math.abs(thumbTip.x - thumbIP.x) > 30;
    fingers.push(thumbExtended);
    
    // Other fingers (vertical check - compare y positions)
    // Finger is extended if tip is significantly above PIP joint
    const indexExtended = indexTip.y < indexPIP.y - 20;
    const middleExtended = middleTip.y < middlePIP.y - 20;
    const ringExtended = ringTip.y < ringPIP.y - 20;
    const pinkyExtended = pinkyTip.y < pinkyPIP.y - 20;
    
    fingers.push(indexExtended, middleExtended, ringExtended, pinkyExtended);
    
    const extendedCount = fingers.filter(f => f).length;

    // Calculate average distance from wrist to fingertips (for fist detection)
    const avgDistance = (
      distance(wrist, indexTip) + 
      distance(wrist, middleTip) + 
      distance(wrist, ringTip) + 
      distance(wrist, pinkyTip)
    ) / 4;

    // Gesture classification
    let gesture = 'Unknown';
    let confidence = 0.5;

    // Closed fist (A) - all fingers close to wrist
    if (extendedCount === 0 && avgDistance < 150) {
      gesture = 'A (Fist)';
      confidence = 0.85;
    }
    // Peace sign (V) - index and middle extended
    else if (extendedCount === 2 && indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      gesture = 'V (Peace)';
      confidence = 0.88;
    }
    // Pointing (index only)
    else if (extendedCount === 1 && indexExtended && !thumbExtended) {
      gesture = 'Point (1)';
      confidence = 0.82;
    }
    // Thumbs up
    else if (extendedCount === 1 && thumbExtended && !indexExtended) {
      gesture = '� (Like)';
      confidence = 0.80;
    }
    // Open hand (Hello) - all fingers extended
    else if (extendedCount === 5) {
      gesture = '👋 (Hello/5)';
      confidence = 0.85;
    }
    // OK sign - thumb and index forming circle
    else if (extendedCount === 3 && !indexExtended && !thumbExtended) {
      gesture = 'OK';
      confidence = 0.75;
    }
    // Three fingers
    else if (extendedCount === 3 && indexExtended && middleExtended && ringExtended) {
      gesture = 'W (3)';
      confidence = 0.80;
    }
    // Four fingers
    else if (extendedCount === 4 && !thumbExtended) {
      gesture = 'B (4)';
      confidence = 0.78;
    }
    // Two fingers (L shape) - thumb and index
    else if (extendedCount === 2 && thumbExtended && indexExtended) {
      gesture = 'L';
      confidence = 0.77;
    }
    else {
      gesture = `${extendedCount} fingers`;
      confidence = 0.60;
    }

    return { sign: gesture, confidence };
  };

  const drawHands = (hands) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || !canvas) return;

    clearCanvas();

    hands.forEach((hand) => {
      const keypoints = hand.keypoints;

      // Draw keypoints
      keypoints.forEach((keypoint) => {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ff00';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw connections
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17] // Palm
      ];

      connections.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(keypoints[start].x, keypoints[start].y);
        ctx.lineTo(keypoints[end].x, keypoints[end].y);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const clearHandCanvas = () => {
    const canvas = handCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const drawHandSkeleton = (landmarks) => {
    const canvas = handCanvasRef.current;
    if (!canvas || !landmarks) return;
    
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Convert landmarks to keypoints format
    const keypoints = landmarks.flat().map((coord) => ({
      x: coord[0],
      y: coord[1],
      z: coord[2] || 0
    }));
    
    if (!keypoints || keypoints.length < 21) return;
    
    // Calculate bounding box for hand
    const xs = keypoints.map(p => p.x);
    const ys = keypoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 50;
    
    // Scale and center the hand in the canvas
    const scale = Math.min(
      (canvas.width - 2 * padding) / width,
      (canvas.height - 2 * padding) / height
    );
    
    const offsetX = (canvas.width - width * scale) / 2 - minX * scale;
    const offsetY = (canvas.height - height * scale) / 2 - minY * scale;
    
    // Transform keypoints
    const transformedPoints = keypoints.map(p => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY
    }));
    
    // Draw background gradient
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width / 2
    );
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Define finger connections with colors
    const fingerConnections = {
      thumb: { points: [[0, 1], [1, 2], [2, 3], [3, 4]], color: '#ef4444' },
      index: { points: [[0, 5], [5, 6], [6, 7], [7, 8]], color: '#f59e0b' },
      middle: { points: [[0, 9], [9, 10], [10, 11], [11, 12]], color: '#10b981' },
      ring: { points: [[0, 13], [13, 14], [14, 15], [15, 16]], color: '#3b82f6' },
      pinky: { points: [[0, 17], [17, 18], [18, 19], [19, 20]], color: '#8b5cf6' },
      palm: { points: [[5, 9], [9, 13], [13, 17], [0, 5], [0, 17]], color: '#06b6d4' }
    };
    
    // Draw connections (bones) with glow effect
    Object.values(fingerConnections).forEach(({ points, color }) => {
      points.forEach(([start, end]) => {
        const startPoint = transformedPoints[start];
        const endPoint = transformedPoints[end];
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        ctx.shadowBlur = 0;
      });
    });
    
    // Draw keypoints (joints)
    transformedPoints.forEach((point, index) => {
      // Larger circles for fingertips
      const isTip = [4, 8, 12, 16, 20].includes(index);
      const radius = isTip ? 8 : 6;
      
      // Draw outer glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffffff';
      
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = index === 0 ? '#ffffff' : (isTip ? '#fbbf24' : '#60a5fa');
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      
      // Draw index labels for key points
      if (isTip || index === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(index, point.x, point.y - 12);
      }
    });
  };

  useEffect(() => {
    socket.on('sentence-update', (data) => {
      onTextUpdate(data.sentence);
      onStatsUpdate(prev => ({
        ...prev,
        totalSigns: data.history.length,
        accuracy: data.history.length > 0 
          ? Math.round(data.history.reduce((sum, item) => sum + item.confidence, 0) / data.history.length * 100)
          : 0
      }));
    });

    return () => {
      socket.off('sentence-update');
    };
  }, []);

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
      {/* Side by Side Layout: Camera and Hand Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera View - Left Side */}
        <div className="relative">
          <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Camera Feed
          </h3>
          <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            onUserMedia={() => setCameraReady(true)}
            videoConstraints={{
              width: 1280,
              height: 720,
              facingMode: "user"
            }}
          />
          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute top-0 left-0 w-full h-full"
          />
          
          {/* Status Overlay */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <p className="text-white text-sm font-medium">
                {cameraReady ? (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    Camera Ready
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                    Initializing...
                  </span>
                )}
              </p>
            </div>

            {isDetecting && currentSign && (
              <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/20">
                <p className="text-white text-lg font-bold">{currentSign}</p>
                <div className="mt-1 w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(Math.max(confidence * 100, 0), 100)}%`, maxWidth: '100%' }}
                  ></div>
                </div>
                <p className="text-white/70 text-xs mt-1 text-center">
                  {Math.round(Math.min(confidence * 100, 100))}% confidence
                </p>
              </div>
            )}
          </div>

          {!isDetecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="text-center">
                <svg className="w-16 h-16 text-white/60 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-white text-lg font-medium">Detection Paused</p>
                <p className="text-white/60 text-sm mt-2">Click "Start Detection" to begin</p>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Hand Skeleton Visualization - Right Side */}
        <div className="relative">
          <h3 className="text-white text-lg font-semibold mb-3 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            Hand Skeleton Detection
          </h3>
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden aspect-video border border-white/10">
            <canvas
              ref={handCanvasRef}
              width={640}
              height={480}
              className="w-full h-full"
            />
            {!handLandmarks && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="text-center">
                  <svg className="w-12 h-12 text-white/30 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                  </svg>
                  <p className="text-white/50 text-sm font-medium">Show your hand</p>
                  <p className="text-white/30 text-xs mt-1">Skeleton will appear here</p>
                </div>
              </div>
            )}

            {/* Current Detection Badge */}
            {isDetecting && currentSign && handLandmarks && (
              <div className="absolute top-4 left-4 right-4">
                <div className="bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg border border-white/30 shadow-xl">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-5xl">{handShapes[currentSign.replace(/[✓⏳👁️]/g, '').trim().split(' ')[0]] || '✋'}</span>
                    <p className="text-white text-xl font-bold">{currentSign}</p>
                  </div>
                  {aslDescriptions[currentSign.replace(/[✓⏳👁️]/g, '').trim().split(' ')[0]] && (
                    <p className="text-white/70 text-sm text-center mb-2 italic">
                      "{aslDescriptions[currentSign.replace(/[✓⏳👁️]/g, '').trim().split(' ')[0]]}"
                    </p>
                  )}
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(Math.max(confidence * 100, 0), 100)}%`, maxWidth: '100%' }}
                    ></div>
                  </div>
                  <p className="text-white/80 text-xs mt-1 text-center font-medium">
                    {Math.round(Math.min(confidence * 100, 100))}% Confidence
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraView;
