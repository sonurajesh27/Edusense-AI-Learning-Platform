import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { allGestures } from '../utils/aslGestures';
import { checkAPIHealth, predictSignAPI, formatLandmarksForAPI } from '../utils/aslModelAPI';
import {
  normalizeHandLandmarks,
  calculatePoseConfidence,
  isHandStable,
  preprocessForPrediction,
  isValidHandPose
} from '../utils/handSignatureProcessor';

const GamifiedLearning = () => {
  const [userProgress, setUserProgress] = useState({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    streak: 7,
    totalSigns: 0,
    badges: ['🥇', '🎯', '🔥', '⭐'],
    achievements: []
  });

  const [selectedGame, setSelectedGame] = useState(null);
  const [gameState, setGameState] = useState({
    score: 0,
    currentRound: 0,
    totalRounds: 5,
    timeLeft: 30,
    isPlaying: false,
    targetSign: '',
    detectedSigns: [],
    correctSigns: 0
  });

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [useEnhancedModel, setUseEnhancedModel] = useState(false);
  const [currentSign, setCurrentSign] = useState('');
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [handStability, setHandStability] = useState(0);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const gestureHistoryRef = useRef([]);
  const lastGestureTimeRef = useRef(0);
  const gestureStableCountRef = useRef(0);
  const isDetectingRef = useRef(false);

  const GESTURE_STABILITY_THRESHOLD = 3; // Need 3 consistent detections for games
  const GESTURE_COOLDOWN = 500; // 500ms cooldown for game responsiveness

  const games = [
    {
      id: 'ai-sign-trainer',
      title: 'AI Sign Trainer',
      description: 'Practice signs with real-time AI feedback',
      icon: '🤖',
      difficulty: 'Easy',
      xpReward: 50,
      color: 'blue'
    },
    {
      id: 'speed-sign',
      title: 'Speed Challenge',
      description: 'Sign letters as fast as you can with AI recognition',
      icon: '⚡',
      difficulty: 'Medium',
      xpReward: 100,
      color: 'yellow'
    },
    {
      id: 'accuracy-test',
      title: 'Accuracy Test',
      description: 'Test sign accuracy with AI precision scoring',
      icon: '🎯',
      difficulty: 'Medium',
      xpReward: 75,
      color: 'purple'
    },
    {
      id: 'word-builder',
      title: 'Smart Word Builder',
      description: 'AI-guided word construction letter by letter',
      icon: '🏗️',
      difficulty: 'Hard',
      xpReward: 150,
      color: 'green'
    },
    {
      id: 'ai-quiz',
      title: 'AI Sign Quiz',
      description: 'Adaptive quiz that learns from your performance',
      icon: '🧠',
      difficulty: 'Hard',
      xpReward: 200,
      color: 'pink'
    },
    {
      id: 'daily-challenge',
      title: 'AI Daily Mission',
      description: 'AI-generated personalized daily challenges',
      icon: '🎁',
      difficulty: 'Variable',
      xpReward: 300,
      color: 'red'
    }
  ];

  const achievements = [
    { id: 1, title: 'AI Pioneer', description: 'Complete first AI training', icon: '🏆', unlocked: true },
    { id: 2, title: 'Week Warrior', description: '7-day AI streak', icon: '🔥', unlocked: true },
    { id: 3, title: 'AI Master', description: '100 signs recognized by AI', icon: '💯', unlocked: false },
    { id: 4, title: 'Speed AI', description: '10 signs in 30 seconds', icon: '⚡', unlocked: false },
    { id: 5, title: 'Perfect AI Score', description: '100% AI accuracy score', icon: '🌟', unlocked: false },
    { id: 6, title: 'AI Grandmaster', description: 'Reach level 10 with AI', icon: '👑', unlocked: false },
  ];

  const leaderboard = [
    { rank: 1, name: 'You', score: userProgress.totalSigns, avatar: '👤', isUser: true },
    { rank: 2, name: 'AI Bot Alex', score: 2300, avatar: '🤖' },
    { rank: 3, name: 'Maria', score: 2100, avatar: '👩' },
    { rank: 4, name: 'AI Bot John', score: 1950, avatar: '🤖' },
    { rank: 5, name: 'Sarah', score: 1800, avatar: '👧' },
  ];

  useEffect(() => {
    const loadModel = async () => {
      setIsModelLoading(true);
      setLoadingProgress(10);

      try {
        await tf.ready();
        setLoadingProgress(30);

        // Load handpose model
        const handposeModel = await handpose.load();
        modelRef.current = handposeModel;
        setLoadingProgress(70);

        // Check if enhanced ASL model API is available
        const apiAvailable = await checkAPIHealth();
        setUseEnhancedModel(apiAvailable);
        setLoadingProgress(100);

        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        setIsModelLoading(false);
        setLoadingProgress(0);
      }
    };
    loadModel();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isCameraReady && !isModelLoading && isDetecting && gameState.isPlaying) {
      startDetection();
    } else {
      stopDetection();
    }
    return () => stopDetection();
  }, [isCameraReady, isModelLoading, isDetecting, gameState.isPlaying]);

  useEffect(() => {
    let timer;
    if (gameState.isPlaying && gameState.timeLeft > 0 && !isModelLoading && isCameraReady) {
      timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (gameState.timeLeft === 0 && gameState.isPlaying) {
      endGame();
    }
    return () => clearTimeout(timer);
  }, [gameState.isPlaying, gameState.timeLeft, isModelLoading, isCameraReady]);

  const startDetection = () => {
    if (detectionIntervalRef.current) return;
    detectionIntervalRef.current = setInterval(() => {
      detectHand();
    }, 200); // Fast detection like CameraView
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const detectHand = async () => {
    if (isDetectingRef.current) return;
    if (!webcamRef.current || !webcamRef.current.video || webcamRef.current.video.readyState !== 4 || !modelRef.current) {
      return;
    }

    isDetectingRef.current = true;

    try {
      const video = webcamRef.current.video;
      const predictions = await modelRef.current.estimateHands(video);

      if (predictions.length > 0) {
        const hand = predictions[0];
        const landmarks = hand.landmarks;

        // Validate hand pose
        if (!isValidHandPose(landmarks)) {
          setCurrentSign('');
          setDetectionConfidence(0);
          gestureHistoryRef.current = [];
          isDetectingRef.current = false;
          return;
        }

        // Draw hand on canvas
        drawHandOnCanvas(landmarks);

        // Recognize gesture
        const detectedSign = await recognizeGesture(landmarks);

        if (detectedSign) {
          // Add to gesture history
          gestureHistoryRef.current.push(detectedSign.sign);
          if (gestureHistoryRef.current.length > 10) {
            gestureHistoryRef.current.shift();
          }

          // Check if gesture is stable (same gesture for multiple frames)
          const recentGestures = gestureHistoryRef.current.slice(-GESTURE_STABILITY_THRESHOLD);
          const isStable = recentGestures.length === GESTURE_STABILITY_THRESHOLD &&
                          recentGestures.every(g => g === detectedSign.sign);

          // Check cooldown period
          const now = Date.now();
          const canCapture = (now - lastGestureTimeRef.current) > GESTURE_COOLDOWN;

          if (isStable && canCapture) {
            // Gesture is stable and cooldown passed
            setCurrentSign(detectedSign.sign);
            setDetectionConfidence(detectedSign.confidence);
            lastGestureTimeRef.current = now;
            gestureStableCountRef.current = 0;

            // Handle game detection
            handleGestureDetected(detectedSign.sign, detectedSign.confidence);
          } else {
            // Show current detection but don't capture yet
            setCurrentSign(detectedSign.sign);
            setDetectionConfidence(detectedSign.confidence);
          }
        } else {
          setCurrentSign('');
          setDetectionConfidence(0);
        }
      } else {
        setCurrentSign('');
        setDetectionConfidence(0);
        gestureHistoryRef.current = [];
      }
    } catch (error) {
      console.error('Detection error:', error);
    } finally {
      isDetectingRef.current = false;
    }
  };

  const drawHandOnCanvas = (landmarks) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Clear with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert landmarks to proper format
    const points = landmarks.map((coord) => ({
      x: coord[0],
      y: coord[1],
      z: coord[2] || 0
    }));

    if (!points || points.length !== 21) return;

    // Calculate bounding box
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = maxX - minX;
    const height = maxY - minY;
    const padding = 30;

    // Scale to fit canvas with proper aspect ratio
    const scale = Math.min(
      (canvas.width - 2 * padding) / width,
      (canvas.height - 2 * padding) / height
    );

    const offsetX = (canvas.width - width * scale) / 2 - minX * scale;
    const offsetY = (canvas.height - height * scale) / 2 - minY * scale;

    // Transform all points
    const transformed = points.map(p => ({
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
      z: p.z
    }));

    // Define hand skeleton connections with proper bone structure
    const skeleton = {
      // Thumb chain
      thumb: [[0, 1], [1, 2], [2, 3], [3, 4]],
      // Index finger chain
      index: [[0, 5], [5, 6], [6, 7], [7, 8]],
      // Middle finger chain
      middle: [[0, 9], [9, 10], [10, 11], [11, 12]],
      // Ring finger chain
      ring: [[0, 13], [13, 14], [14, 15], [15, 16]],
      // Pinky finger chain
      pinky: [[0, 17], [17, 18], [18, 19], [19, 20]],
      // Palm connections
      palm: [[5, 9], [9, 13], [13, 17], [17, 0], [0, 5]]
    };

    // Draw bones (connections) with gradient thickness
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw each bone segment
    Object.entries(skeleton).forEach(([fingerName, connections]) => {
      connections.forEach(([startIdx, endIdx]) => {
        const start = transformed[startIdx];
        const end = transformed[endIdx];

        // Calculate bone thickness based on z-depth (3D effect)
        const avgZ = (start.z + end.z) / 2;
        const thickness = Math.max(2, 6 - Math.abs(avgZ) / 60);

        // Draw bone shadow for depth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = thickness + 1.5;
        ctx.beginPath();
        ctx.moveTo(start.x + 1.5, start.y + 1.5);
        ctx.lineTo(end.x + 1.5, end.y + 1.5);
        ctx.stroke();

        // Draw main bone
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      });
    });

    // Draw joints (landmarks)
    transformed.forEach((point, index) => {
      // Joint categories
      const isWrist = index === 0;
      const isTip = [4, 8, 12, 16, 20].includes(index);
      const isBase = [1, 5, 9, 13, 17].includes(index);
      const isPIP = [2, 6, 10, 14, 18].includes(index);
      const isDIP = [3, 7, 11, 15, 19].includes(index);

      // Determine joint size based on type
      let radius;
      if (isWrist) radius = 7;
      else if (isTip) radius = 6;
      else if (isBase) radius = 5;
      else if (isPIP || isDIP) radius = 4;
      else radius = 3;

      // Draw joint shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(point.x + 1.5, point.y + 1.5, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw joint outer ring
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw joint inner highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius - 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw joint center
      if (isWrist || isTip) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  };

  const recognizeGesture = async (landmarks) => {
    // Use fingerpose gesture estimator
    try {
      const GE = new window.fp.GestureEstimator(allGestures);
      const gesture = await GE.estimate(landmarks, 7.5);

      if (gesture.gestures && gesture.gestures.length > 0) {
        // Sort by score to get best match
        const sorted = gesture.gestures.sort((a, b) => b.score - a.score);
        const bestGesture = sorted[0];

        console.log('Detected:', bestGesture.name, 'Score:', bestGesture.score);

        // Only return if score is above threshold (7.5 out of 10)
        if (bestGesture.score >= 7.5) {
          return {
            sign: bestGesture.name,
            confidence: bestGesture.score / 10 // Normalize to 0-1
          };
        }
      } else {
        console.log('No gestures detected');
      }
    } catch (error) {
      console.error('Gesture estimator error:', error);
    }

    return null;
  };

  const handleGestureDetected = (sign, confidence) => {
    if (gameState.isPlaying && gameState.targetSign) {
      if (sign.toLowerCase() === gameState.targetSign.toLowerCase()) {
        handleCorrectSign();
        // Reset history after successful detection
        gestureHistoryRef.current = [];
      }
    }
  };

  const handleCorrectSign = () => {
    setGameState(prev => ({
      ...prev,
      score: prev.score + 10,
      correctSigns: prev.correctSigns + 1,
      detectedSigns: [...prev.detectedSigns, prev.targetSign],
      targetSign: getNextTargetSign()
    }));

    setUserProgress(prev => ({
      ...prev,
      totalSigns: prev.totalSigns + 1,
      xp: prev.xp + 10
    }));
  };

  const getNextTargetSign = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * letters.length)];
  };

  const startGame = (game) => {
    setSelectedGame(game);
    const initialTarget = getNextTargetSign();
    setGameState({
      score: 0,
      currentRound: 1,
      totalRounds: 5,
      timeLeft: game.id === 'speed-sign' ? 60 : 30,
      isPlaying: true,
      targetSign: initialTarget,
      detectedSigns: [],
      correctSigns: 0
    });
    setIsDetecting(true);
  };

  const endGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
    setIsDetecting(false);
    const xpGained = gameState.score * 2;
    setUserProgress(prev => ({
      ...prev,
      xp: prev.xp + xpGained
    }));
  };

  const closeGame = () => {
    setSelectedGame(null);
    setIsDetecting(false);
    setGameState({
      score: 0,
      currentRound: 0,
      totalRounds: 5,
      timeLeft: 30,
      isPlaying: false,
      targetSign: '',
      detectedSigns: [],
      correctSigns: 0
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-6xl">
        {!selectedGame ? (
          <>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">🤖 AI-Powered Learning</h1>
                  <p className="text-white/70">Level {userProgress.level} • {userProgress.totalSigns} Signs Mastered with AI</p>
                  {useEnhancedModel && (
                    <p className="text-green-400 text-sm mt-1">✅ Enhanced AI Model Active</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex gap-2 text-2xl mb-2">
                    {userProgress.badges.map((badge, idx) => (
                      <span key={idx} className="transform hover:scale-125 transition-transform cursor-pointer">
                        {badge}
                      </span>
                    ))}
                  </div>
                  <p className="text-white/70 text-sm">
                    <span className="text-orange-400 font-bold">{userProgress.streak}</span> day AI streak 🔥
                  </p>
                </div>
              </div>

              <div className="bg-white/10 rounded-full h-8 overflow-hidden border border-white/20">
                <div className="flex items-center h-full px-4 relative">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 absolute left-0"
                    style={{ width: `${(userProgress.xp / userProgress.xpToNextLevel) * 100}%` }}
                  ></div>
                  <span className="text-white text-sm font-bold ml-auto relative z-10">
                    {userProgress.xp} / {userProgress.xpToNextLevel} XP
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">🎯 AI-Powered Games</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400 transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                    onClick={() => startGame(game)}
                  >
                    <div className="text-5xl mb-3 text-center group-hover:scale-110 transition-transform">{game.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2 text-center">{game.title}</h3>
                    <p className="text-white/70 text-sm mb-4 text-center">{game.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-semibold ${getDifficultyColor(game.difficulty)}`}>
                        {game.difficulty}
                      </span>
                      <span className="text-yellow-400 font-bold">+{game.xpReward} XP</span>
                    </div>
                    <div className="mt-3 text-center">
                      <span className="text-xs text-purple-300">🤖 AI Powered</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-3xl mr-2">🏆</span>
                  AI Leaderboard
                </h2>
                <div className="space-y-3">
                  {leaderboard.map((user) => (
                    <div
                      key={user.rank}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        user.isUser ? 'bg-blue-500/30 border-2 border-blue-500' : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${
                          user.rank === 1 ? 'text-yellow-400' :
                          user.rank === 2 ? 'text-gray-300' :
                          user.rank === 3 ? 'text-orange-400' :
                          'text-white/50'
                        }`}>
                          #{user.rank}
                        </span>
                        <span className="text-3xl">{user.avatar}</span>
                        <span className="text-white font-semibold">{user.name}</span>
                      </div>
                      <span className="text-yellow-400 font-bold">{user.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-3xl mr-2">🎖️</span>
                  AI Achievements
                </h2>
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        achievement.unlocked ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 opacity-50'
                      }`}
                    >
                      <span className="text-4xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{achievement.title}</h3>
                        <p className="text-white/70 text-sm">{achievement.description}</p>
                      </div>
                      {achievement.unlocked && (
                        <span className="text-green-400 text-2xl">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-6xl">{selectedGame.icon}</span>
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedGame.title}</h2>
                  <p className="text-white/70">{selectedGame.description}</p>
                  <p className="text-purple-300 text-sm mt-1">🤖 AI Recognition Active</p>
                </div>
              </div>
              <button
                onClick={closeGame}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{gameState.score}</div>
                <p className="text-white/70 text-sm">AI Score</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{gameState.correctSigns}</div>
                <p className="text-white/70 text-sm">Correct</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className={`text-3xl font-bold ${gameState.timeLeft < 10 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                  {gameState.timeLeft}s
                </div>
                <p className="text-white/70 text-sm">Time</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{Math.round(handStability * 100)}%</div>
                <p className="text-white/70 text-sm">Stability</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-black/30 rounded-xl overflow-hidden border border-white/20">
                {isModelLoading ? (
                  <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-blue-900/30 to-purple-900/30">
                    <div className="text-center w-64">
                      <div className="text-4xl mb-4 animate-spin">🤖</div>
                      <p className="text-white font-semibold mb-4">Loading AI Model...</p>
                      <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
                          style={{ width: `${loadingProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-white/70 text-sm mt-2">{loadingProgress}%</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Webcam
                      ref={webcamRef}
                      onUserMedia={() => setIsCameraReady(true)}
                      screenshotFormat="image/jpeg"
                      className="w-full aspect-video"
                      mirrored={true}
                      videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: "user"
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border-2 border-gray-300">
                      <canvas
                        ref={canvasRef}
                        width={200}
                        height={200}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">AI Target Sign</h3>
                  {gameState.isPlaying ? (
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-8 mb-4">
                      <div className="text-8xl font-bold text-white">{gameState.targetSign}</div>
                    </div>
                  ) : (
                    <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-6">
                      <div className="text-5xl mb-4">🎉</div>
                      <h4 className="text-2xl font-bold text-white mb-2">AI Training Complete!</h4>
                      <p className="text-green-300 text-lg mb-2">Score: {gameState.score}</p>
                      <p className="text-purple-300 text-sm mb-4">Correct Signs: {gameState.correctSigns}</p>
                      <p className="text-yellow-300 font-bold mb-4">XP Gained: +{gameState.score * 2}</p>
                      <button
                        onClick={closeGame}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        Continue Learning
                      </button>
                    </div>
                  )}
                </div>

                {gameState.isPlaying && (
                  <div>
                    <div className="bg-white/10 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/70 text-sm">Current Detection</span>
                        <span className="text-white font-bold text-lg">{currentSign.toUpperCase() || '--'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70 text-sm">AI Confidence</span>
                        <span className="text-green-400 font-bold">{Math.round(detectionConfidence * 10)}%</span>
                      </div>
                    </div>

                    <button
                      onClick={endGame}
                      className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                      End Session
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamifiedLearning;
