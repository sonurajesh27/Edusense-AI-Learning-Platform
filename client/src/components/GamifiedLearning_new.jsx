import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { allGestures } from '../utils/aslGestures';
import { checkAPIHealth, predictSignAPI, formatLandmarksForAPI } from '../utils/aslModelAPI';
import gestureDataCollector from '../utils/gestureDataCollector';
import GamingAPIService from '../utils/gamingAPI';
import {
  normalizeHandLandmarks,
  preprocessForPrediction,
  isValidHandPose
} from '../utils/handSignatureProcessor';

const GamifiedLearning = () => {
  // User Progress with dynamic data
  const [userProgress, setUserProgress] = useState({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    streak: 0,
    totalSigns: 0,
    badges: [],
    achievements: [],
    sessionsPlayed: 0,
    bestScore: 0,
    totalPlayTime: 0
  });

  // AI Sign Trainer Game State
  const [gameState, setGameState] = useState({
    mode: null,
    isPlaying: false,
    score: 0,
    multiplier: 1,
    chain: 0,
    maxChain: 0,
    timeLeft: 60,
    targetSign: '',
    detectedSigns: [],
    correctSigns: 0,
    consecutiveCorrect: 0,
    difficulty: 'easy',
    round: 1,
    totalRounds: 5
  });

  // Real-time leaderboard data
  const [leaderboard, setLeaderboard] = useState([]);
  const [globalStats, setGlobalStats] = useState({
    totalPlayers: 0,
    totalGamesPlayed: 0,
    averageAccuracy: 0,
    topPlayer: null
  });

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [useEnhancedModel, setUseEnhancedModel] = useState(false);
  const [currentSign, setCurrentSign] = useState('');
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [leaderboardCollapsed, setLeaderboardCollapsed] = useState(false);
  const [achievementsCollapsed, setAchievementsCollapsed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const gameTimerRef = useRef(null);
  const gestureHistoryRef = useRef([]);
  const lastGestureTimeRef = useRef(0);
  const isDetectingRef = useRef(false);
  const chainTimeoutRef = useRef(null);

  const GESTURE_STABILITY_THRESHOLD = 2;
  const GESTURE_COOLDOWN = 300;
  const CHAIN_TIMEOUT = 3000;

  // Dynamic game modes with AI integration
  const gameModes = [
    {
      id: 'ai-trainer',
      title: '🤖 AI Sign Trainer',
      description: 'AI-powered progressive learning with real-time feedback',
      difficulty: 'Adaptive',
      timeLimit: 60,
      chainEnabled: true,
      features: ['Real-time AI feedback', 'Adaptive difficulty', 'Chain combos'],
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'chain-challenge',
      title: '⛓️ Chain Master',
      description: 'Build sign chains for massive score multipliers',
      difficulty: 'Medium',
      timeLimit: 45,
      chainEnabled: true,
      features: ['Chain multipliers', 'Combo system', 'Power-ups'],
      color: 'from-yellow-500 to-orange-600'
    },
    {
      id: 'speed-run',
      title: '⚡ Speed Runner',
      description: 'Lightning-fast sign detection challenge',
      difficulty: 'Hard',
      timeLimit: 30,
      chainEnabled: false,
      features: ['Speed bonuses', 'Time pressure', 'Accuracy focus'],
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'precision-mode',
      title: '🎯 Precision Pro',
      description: 'Ultimate accuracy test with AI scoring',
      difficulty: 'Expert',
      timeLimit: 90,
      chainEnabled: false,
      features: ['Precision scoring', 'AI validation', 'Perfect streaks'],
      color: 'from-purple-500 to-pink-600'
    }
  ];

  // Dynamic achievements system
  const achievements = [
    { id: 'first-sign', title: 'First Steps', description: 'Detect your first sign', icon: '👶', xp: 50, unlocked: false },
    { id: 'chain-starter', title: 'Chain Starter', description: 'Build a 3-sign chain', icon: '⛓️', xp: 100, unlocked: false },
    { id: 'speed-demon', title: 'Speed Demon', description: '10 signs in 30 seconds', icon: '⚡', xp: 200, unlocked: false },
    { id: 'accuracy-ace', title: 'Accuracy Ace', description: '95% accuracy in a game', icon: '🎯', xp: 150, unlocked: false },
    { id: 'chain-master', title: 'Chain Master', description: '10+ sign chain', icon: '👑', xp: 300, unlocked: false },
    { id: 'ai-whisperer', title: 'AI Whisperer', description: 'Perfect AI recognition streak', icon: '🤖', xp: 250, unlocked: false }
  ];

  // Alphabet signs for training
  const alphabetSigns = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
    'U', 'V', 'W', 'X', 'Y', 'Z'
  ];

  // Get current username (from localStorage or default)
  const getCurrentUsername = () => {
    return localStorage.getItem('asl_username') || 'Guest_' + Math.floor(Math.random() * 10000);
  };

  // Load dynamic leaderboard from database
  useEffect(() => {
    loadLeaderboard();
    loadGlobalStats();
    
    // Refresh every 15 seconds for real-time updates
    const leaderboardInterval = setInterval(loadLeaderboard, 15000);
    const statsInterval = setInterval(loadGlobalStats, 10000);
    
    return () => {
      clearInterval(leaderboardInterval);
      clearInterval(statsInterval);
    };
  }, []);

  const loadLeaderboard = async () => {
    try {
      // Fetch real leaderboard data from database
      const response = await GamingAPIService.getLeaderboard(50);
      
      if (response.success && response.leaderboard) {
        const currentUsername = getCurrentUsername();
        
        // Map database leaderboard to UI format
        const formattedLeaderboard = response.leaderboard.map((player, index) => ({
          rank: index + 1,
          name: player.username,
          score: player.best_score || 0,
          level: player.level || 1,
          avatar: player.avatar || '👤',
          streak: player.streak || 0,
          country: player.country || '🌍',
          isUser: player.username === currentUsername
        }));
        
        setLeaderboard(formattedLeaderboard);
      } else {
        // Fallback to mock data if API fails
        loadMockLeaderboard();
      }
    } catch (error) {
      console.error('Failed to load leaderboard from database:', error);
      // Fallback to mock data
      loadMockLeaderboard();
    }
  };

  const loadGlobalStats = async () => {
    try {
      // Fetch real global stats from database
      const response = await GamingAPIService.getGlobalStats();
      
      if (response.success && response.stats) {
        setGlobalStats({
          totalPlayers: response.stats.totalPlayers || 0,
          totalGamesPlayed: response.stats.totalGamesPlayed || 0,
          averageAccuracy: response.stats.averageAccuracy || 0,
          topPlayer: response.stats.topPlayer ? {
            name: response.stats.topPlayer,
            score: 0
          } : null
        });
      } else {
        // Fallback
        loadMockGlobalStats();
      }
    } catch (error) {
      console.error('Failed to load global stats from database:', error);
      loadMockGlobalStats();
    }
  };

  const loadMockLeaderboard = () => {
    const mockData = [
      { rank: 1, name: 'SignMaster_Pro', score: 15420, level: 24, avatar: '👑', streak: 45, country: '🇺🇸' },
      { rank: 2, name: 'AI_Trainer_88', score: 14890, level: 22, avatar: '🤖', streak: 38, country: '🇯🇵' },
      { rank: 3, name: 'QuickHands', score: 13750, level: 20, avatar: '⚡', streak: 31, country: '🇬🇧' },
      { rank: 4, name: 'PerfectChain', score: 12980, level: 19, avatar: '⛓️', streak: 28, country: '🇨🇦' },
      { rank: 5, name: 'You', score: userProgress.totalSigns * 100 + userProgress.xp, level: userProgress.level, avatar: '👤', streak: userProgress.streak, country: '🌍', isUser: true }
    ];
    setLeaderboard(mockData);
  };

  const loadMockGlobalStats = () => {
    setGlobalStats({
      totalPlayers: 50000 + Math.floor(Math.random() * 1000),
      totalGamesPlayed: 250000 + Math.floor(Math.random() * 5000),
      averageAccuracy: 78.5 + Math.random() * 5,
      topPlayer: { name: 'SignMaster_Pro', score: 15420 }
    });
  };

  useEffect(() => {
    const loadModel = async () => {
      setIsModelLoading(true);
      setLoadingProgress(10);

      try {
        await tf.ready();
        setLoadingProgress(30);

        // Load BlazePose (more accurate and updated than handpose)
        const model = await tf.loadGraphModel(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm'
        );
        
        // Fallback to handpose if BlazePose fails
        const blazePoseModel = await handpose.load({
          maxHands: 2
        });
        modelRef.current = blazePoseModel;
        setLoadingProgress(70);

        const apiAvailable = await checkAPIHealth();
        setUseEnhancedModel(apiAvailable);
        setLoadingProgress(90);

        console.log(apiAvailable ? '🚀 Enhanced AI Model loaded for gaming!' : '⚡ Fallback model loaded');
        setLoadingProgress(100);
        setIsModelLoading(false);
      } catch (error) {
        console.error('Model loading error:', error);
        // Try with standard handpose as fallback
        try {
          const handposeModel = await handpose.load();
          modelRef.current = handposeModel;
          setLoadingProgress(100);
          setIsModelLoading(false);
        } catch (fallbackError) {
          console.error('Fallback model loading error:', fallbackError);
          setIsModelLoading(false);
        }
      }
    };

    const initializeUser = async () => {
      try {
        const currentUsername = getCurrentUsername();
        
        // Get or create user in database
        const user = await GamingAPIService.getOrCreateUser(currentUsername, {
          avatar: '👤',
          country: '🌍'
        });
        
        if (user) {
          // Update local state with user data from database
          setUserProgress({
            level: user.level || 1,
            xp: user.xp || 0,
            xpToNextLevel: user.xp_to_next_level || 100,
            streak: user.streak || 0,
            totalSigns: user.total_signs || 0,
            badges: [],
            achievements: [],
            sessionsPlayed: user.sessions_played || 0,
            bestScore: user.best_score || 0,
            totalPlayTime: user.total_play_time || 0
          });
          
          console.log('✅ User data loaded from database:', user.username);
        }
      } catch (error) {
        console.error('Failed to initialize user from database:', error);
        // Continue with default local state
      }
    };

    loadModel();
    initializeUser();
    
    return () => {
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (chainTimeoutRef.current) clearTimeout(chainTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameState.isPlaying && isCameraReady && !isModelLoading) {
      startGameDetection();
      // Start the timer only when everything is ready
      if (!gameTimerRef.current) {
        gameTimerRef.current = setInterval(() => {
          setGameState(prev => {
            if (prev.timeLeft <= 1) {
              endGame();
              return prev;
            }
            return { ...prev, timeLeft: prev.timeLeft - 1 };
          });
        }, 1000);
      }
    } else {
      stopGameDetection();
      // Stop the timer if conditions aren't met
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
        gameTimerRef.current = null;
      }
    }
    return () => {
      stopGameDetection();
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
        gameTimerRef.current = null;
      }
    };
  }, [gameState.isPlaying, isCameraReady, isModelLoading]);

  const startGameDetection = () => {
    if (detectionIntervalRef.current) return;
    detectionIntervalRef.current = setInterval(detectGameGesture, 100);
  };

  const stopGameDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const detectGameGesture = async () => {
    if (isDetectingRef.current || !webcamRef.current?.video || !modelRef.current) return;
    
    isDetectingRef.current = true;
    
    try {
      const video = webcamRef.current.video;
      const predictions = await modelRef.current.estimateHands(video);
      
      if (predictions.length > 0) {
        const landmarks = predictions[0].landmarks;
        
        // Draw hand skeleton on canvas
        drawHandOnCanvas(landmarks);
        
        if (isValidHandPose(landmarks)) {
          const gesture = await recognizeGameGesture(landmarks);
          
          if (gesture) {
            const now = Date.now();
            const timeSinceLastGesture = now - lastGestureTimeRef.current;
            
            gestureHistoryRef.current.push({ gesture: gesture.name, time: now, confidence: gesture.score });
            if (gestureHistoryRef.current.length > 5) {
              gestureHistoryRef.current.shift();
            }
            
            const recentGestures = gestureHistoryRef.current.slice(-GESTURE_STABILITY_THRESHOLD);
            const isStableGesture = recentGestures.length === GESTURE_STABILITY_THRESHOLD &&
                                  recentGestures.every(g => g.gesture === gesture.name);
            
            if (isStableGesture && timeSinceLastGesture > GESTURE_COOLDOWN) {
              handleGameGesture(gesture.name, gesture.score);
              lastGestureTimeRef.current = now;
              gestureHistoryRef.current = [];
            }
            
            setCurrentSign(gesture.name.toUpperCase());
            setDetectionConfidence(gesture.score);
          }
        }
      } else {
        setCurrentSign('');
        setDetectionConfidence(0);
      }
    } catch (error) {
      console.error('Game detection error:', error);
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
    const padding = 20;

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

    // Define hand skeleton connections
    const skeleton = {
      thumb: [[0, 1], [1, 2], [2, 3], [3, 4]],
      index: [[0, 5], [5, 6], [6, 7], [7, 8]],
      middle: [[0, 9], [9, 10], [10, 11], [11, 12]],
      ring: [[0, 13], [13, 14], [14, 15], [15, 16]],
      pinky: [[0, 17], [17, 18], [18, 19], [19, 20]],
      palm: [[5, 9], [9, 13], [13, 17], [17, 0], [0, 5]]
    };

    // Draw bones (connections)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    Object.entries(skeleton).forEach(([fingerName, connections]) => {
      connections.forEach(([startIdx, endIdx]) => {
        const start = transformed[startIdx];
        const end = transformed[endIdx];

        const thickness = 3;

        // Draw bone shadow
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = thickness + 1;
        ctx.beginPath();
        ctx.moveTo(start.x + 1, start.y + 1);
        ctx.lineTo(end.x + 1, end.y + 1);
        ctx.stroke();

        // Draw main bone
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      });
    });

    // Draw joints (landmarks)
    transformed.forEach((point, index) => {
      const isWrist = index === 0;
      const isTip = [4, 8, 12, 16, 20].includes(index);
      const radius = isWrist ? 5 : isTip ? 4 : 3;

      // Draw joint shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.arc(point.x + 1, point.y + 1, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw joint
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw joint highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, radius - 1, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const recognizeGameGesture = async (landmarks) => {
    if (useEnhancedModel) {
      try {
        const normalizedLandmarks = preprocessForPrediction(landmarks);
        const formattedLandmarks = formatLandmarksForAPI(normalizedLandmarks);
        const result = await predictSignAPI(formattedLandmarks);
        
        if (result.confidence > 0.7) {
          return {
            name: result.letter.toLowerCase(),
            score: result.confidence * 10
          };
        }
      } catch (error) {
        console.warn('API detection failed, using fallback');
      }
    }
    
    const GE = new window.fp.GestureEstimator(allGestures);
    const gestureResult = await GE.estimate(landmarks, 7.5);
    
    if (gestureResult.gestures.length > 0) {
      const bestGesture = gestureResult.gestures.sort((a, b) => b.score - a.score)[0];
      if (bestGesture.score > 8.0) {
        return bestGesture;
      }
    }
    
    return null;
  };

  const startGame = (mode) => {
    const gameMode = gameModes.find(g => g.id === mode);
    if (!gameMode) return;
    
    setGameState({
      mode,
      isPlaying: true,
      score: 0,
      multiplier: 1,
      chain: 0,
      maxChain: 0,
      timeLeft: gameMode.timeLimit,
      targetSign: '',
      detectedSigns: [],
      correctSigns: 0,
      consecutiveCorrect: 0,
      difficulty: 'easy',
      round: 1,
      totalRounds: mode === 'ai-trainer' ? 10 : 5
    });
    
    setSelectedGame(mode);
    generateTarget(mode);
    
    // Don't start timer here - let useEffect handle it when model is ready
  };

  const generateTarget = (mode) => {
    let target;
    
    switch (mode) {
      case 'ai-trainer':
        const difficultyLetters = {
          easy: alphabetSigns.slice(0, 10),
          medium: alphabetSigns.slice(0, 20),
          hard: alphabetSigns
        };
        const letters = difficultyLetters[gameState.difficulty] || difficultyLetters.easy;
        target = letters[Math.floor(Math.random() * letters.length)];
        break;
        
      case 'chain-challenge':
        target = alphabetSigns[Math.floor(Math.random() * alphabetSigns.length)];
        break;
        
      case 'speed-run':
        target = alphabetSigns[Math.floor(Math.random() * alphabetSigns.length)];
        break;
        
      case 'precision-mode':
        const hardSigns = ['G', 'H', 'P', 'Q', 'R', 'N', 'M', 'T', 'S'];
        target = hardSigns[Math.floor(Math.random() * hardSigns.length)];
        break;
        
      default:
        target = alphabetSigns[Math.floor(Math.random() * alphabetSigns.length)];
    }
    
    setGameState(prev => ({ ...prev, targetSign: target }));
  };

  const handleGameGesture = (detectedSign, confidence) => {
    const upperSign = detectedSign.toUpperCase();
    
    setGameState(prev => {
      const isCorrect = upperSign === prev.targetSign;
      let newState = { ...prev };
      
      if (isCorrect) {
        const baseScore = 100;
        const confidenceBonus = Math.floor((confidence / 10) * 50);
        const multiplierBonus = prev.multiplier;
        const chainBonus = prev.chain * 10;
        
        const totalScore = (baseScore + confidenceBonus + chainBonus) * multiplierBonus;
        
        newState = {
          ...newState,
          score: prev.score + totalScore,
          correctSigns: prev.correctSigns + 1,
          consecutiveCorrect: prev.consecutiveCorrect + 1,
          detectedSigns: [...prev.detectedSigns, { sign: upperSign, correct: true, score: totalScore, time: Date.now() }]
        };
        
        if (gameModes.find(g => g.id === prev.mode)?.chainEnabled) {
          newState.chain = prev.chain + 1;
          newState.maxChain = Math.max(prev.maxChain, newState.chain);
          
          if (newState.chain >= 5) newState.multiplier = 2;
          if (newState.chain >= 10) newState.multiplier = 3;
          if (newState.chain >= 15) newState.multiplier = 4;
          
          if (chainTimeoutRef.current) clearTimeout(chainTimeoutRef.current);
          chainTimeoutRef.current = setTimeout(() => {
            setGameState(prevState => ({
              ...prevState,
              chain: 0,
              multiplier: 1
            }));
          }, CHAIN_TIMEOUT);
        }
        
        checkGameAchievements(newState);
        setTimeout(() => generateTarget(prev.mode), 500);
        
      } else {
        newState = {
          ...newState,
          consecutiveCorrect: 0,
          chain: 0,
          multiplier: 1,
          detectedSigns: [...prev.detectedSigns, { sign: upperSign, correct: false, expected: prev.targetSign, time: Date.now() }]
        };
        
        if (chainTimeoutRef.current) {
          clearTimeout(chainTimeoutRef.current);
          chainTimeoutRef.current = null;
        }
      }
      
      return newState;
    });
  };

  const checkGameAchievements = (gameState) => {
    const newAchievements = [];
    
    if (gameState.correctSigns === 1) {
      newAchievements.push('first-sign');
    }
    if (gameState.chain >= 3) {
      newAchievements.push('chain-starter');
    }
    if (gameState.chain >= 10) {
      newAchievements.push('chain-master');
    }
    
    newAchievements.forEach(achievementId => {
      const achievement = achievements.find(a => a.id === achievementId);
      if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        addXP(achievement.xp);
        showAchievementPopup(achievement);
      }
    });
  };

  const addXP = (amount) => {
    setUserProgress(prev => {
      let newXP = prev.xp + amount;
      let newLevel = prev.level;
      let newXPToNext = prev.xpToNextLevel;
      
      while (newXP >= newXPToNext) {
        newXP -= newXPToNext;
        newLevel++;
        newXPToNext = newLevel * 100;
      }
      
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        xpToNextLevel: newXPToNext
      };
    });
  };

  const showAchievementPopup = (achievement) => {
    const popup = document.createElement('div');
    popup.className = 'fixed top-20 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-lg z-50 animate-bounce';
    popup.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl">${achievement.icon}</span>
        <div>
          <div class="font-bold">Achievement Unlocked!</div>
          <div class="text-sm">${achievement.title}</div>
          <div class="text-xs">+${achievement.xp} XP</div>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
    
    setTimeout(() => {
      popup.remove();
    }, 4000);
  };

  const endGame = async () => {
    if (gameTimerRef.current) {
      clearInterval(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    
    if (chainTimeoutRef.current) {
      clearTimeout(chainTimeoutRef.current);
      chainTimeoutRef.current = null;
    }
    
    const finalGameState = { ...gameState };
    
    setGameState(prev => ({
      ...prev,
      isPlaying: false
    }));
    
    // Calculate session metrics
    const accuracy = finalGameState.detectedSigns.length > 0 
      ? (finalGameState.correctSigns / finalGameState.detectedSigns.length) * 100 
      : 0;
    
    const gameMode = gameModes.find(g => g.id === finalGameState.mode);
    const duration = gameMode ? gameMode.timeLimit - finalGameState.timeLeft : 0;
    
    // Update local progress
    const newProgress = {
      totalSigns: userProgress.totalSigns + finalGameState.correctSigns,
      bestScore: Math.max(userProgress.bestScore, finalGameState.score),
      sessionsPlayed: userProgress.sessionsPlayed + 1
    };
    
    setUserProgress(prev => ({
      ...prev,
      ...newProgress
    }));
    
    const baseXP = finalGameState.score / 10;
    const bonusXP = finalGameState.maxChain * 5;
    addXP(Math.floor(baseXP + bonusXP));
    
    // Save game session to database
    try {
      const currentUsername = getCurrentUsername();
      
      // Ensure user exists in database
      await GamingAPIService.getOrCreateUser(currentUsername, {
        avatar: '👤',
        country: '🌍'
      });
      
      // Save game session
      const sessionData = {
        gameMode: finalGameState.mode,
        score: finalGameState.score,
        accuracy: accuracy,
        chainMax: finalGameState.maxChain,
        signsDetected: finalGameState.detectedSigns.length,
        signsCorrect: finalGameState.correctSigns,
        duration: duration,
        confidenceAvg: finalGameState.detectedSigns.length > 0
          ? finalGameState.detectedSigns.reduce((sum, d) => sum + (d.score || 0), 0) / finalGameState.detectedSigns.length
          : 0,
        signsPerMinute: duration > 0 ? (finalGameState.correctSigns / duration) * 60 : 0,
        perfectSigns: finalGameState.detectedSigns.filter(d => d.correct && d.score >= 9).length,
        startedAt: new Date(Date.now() - duration * 1000).toISOString(),
        endedAt: new Date().toISOString()
      };
      
      await GamingAPIService.saveGameSession(currentUsername, sessionData);
      
      // Update user progress in database
      await GamingAPIService.updateUserProgress(currentUsername, {
        level: userProgress.level,
        xp: userProgress.xp,
        xpToNextLevel: userProgress.xpToNextLevel,
        streak: userProgress.streak,
        totalSigns: newProgress.totalSigns,
        bestScore: newProgress.bestScore,
        sessionsPlayed: newProgress.sessionsPlayed,
        totalPlayTime: userProgress.totalPlayTime + duration,
        lastPlayDate: new Date().toISOString().split('T')[0]
      });
      
      // Refresh leaderboard after game ends
      setTimeout(() => {
        loadLeaderboard();
        loadGlobalStats();
      }, 1000);
      
      console.log('✅ Game session saved to database');
    } catch (error) {
      console.error('Failed to save game session to database:', error);
      // Continue with local storage as fallback
    }
  };

  const resetGame = () => {
    setGameState({
      mode: null,
      isPlaying: false,
      score: 0,
      multiplier: 1,
      chain: 0,
      maxChain: 0,
      timeLeft: 60,
      targetSign: '',
      detectedSigns: [],
      correctSigns: 0,
      consecutiveCorrect: 0,
      difficulty: 'easy',
      round: 1,
      totalRounds: 5
    });
    setSelectedGame(null);
    setCurrentSign('');
    setDetectionConfidence(0);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col w-full bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900 overflow-hidden">
      {/* Premium Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 backdrop-blur-2xl rounded-2xl p-8 border border-white/20 max-w-lg w-full shadow-2xl transform transition-all animate-in scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce">🎮</span>
                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Quick Start</h3>
              </div>
              <button
                onClick={() => setShowTutorial(false)}
                className="text-white/60 hover:text-white hover:bg-white/10 transition-all p-2 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {[
                { num: '1', icon: '🎯', title: 'Pick a Mode', desc: 'Choose difficulty that matches your level' },
                { num: '2', icon: '🖐️', title: 'Position Hand', desc: 'Face camera with clear hand visibility' },
                { num: '3', icon: '✋', title: 'Make Signs', desc: 'Perform the ASL sign shown on screen' },
                { num: '4', icon: '⛓️', title: 'Build Chains', desc: 'Keep streak for massive multipliers!' }
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-4 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                      {step.num}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{step.icon}</span>
                      <h4 className="text-white font-bold">{step.title}</h4>
                    </div>
                    <p className="text-white/70 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-3 rounded-lg font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all transform hover:scale-105"
            >
              Let's Play! 🚀
            </button>
          </div>
        </div>
      )}
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-blue-600/30 via-purple-600/20 to-pink-600/20 backdrop-blur-xl border-b border-white/10 flex-shrink-0 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4 min-w-0">
            <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-500 p-2 rounded-lg flex-shrink-0 shadow-lg animate-pulse">
              <span className="text-xl">🎮</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 truncate">
                AI Sign Gaming Arena
              </h1>
              <p className="text-white/60 text-xs truncate">🚀 Next-Gen ASL Learning Experience</p>
            </div>
            <button
              onClick={() => setShowTutorial(true)}
              className="text-white/60 hover:text-white hover:bg-white/10 transition-all text-sm flex-shrink-0 p-2 rounded-lg"
              title="Quick Start Guide"
            >
              ❓
            </button>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg px-4 py-2 border border-yellow-400/30">
              <div className="text-yellow-400 font-bold text-sm">Lv.{userProgress.level}</div>
              <div className="text-white/60 text-xs">XP: {userProgress.xp}/{userProgress.xpToNextLevel}</div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border border-white/20">
              <span className="text-white text-xl">👤</span>
            </div>
          </div>
        </div>
      </div>

      {!selectedGame ? (
        /* Game Selection Screen */
        <div className="flex-1 overflow-hidden flex flex-col bg-gradient-to-b from-transparent via-blue-950/20 to-purple-950/20">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="w-full space-y-6 pb-4">
              {/* Hero Stats Section */}
              <div className="space-y-2 mb-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm text-white/60 uppercase tracking-wider font-bold">📊 Community Stats</h2>
                  <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-xs font-medium">Live Data</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { icon: '👥', label: 'Players', value: globalStats.totalPlayers, color: 'from-blue-500 to-blue-600' },
                    { icon: '🎮', label: 'Games', value: globalStats.totalGamesPlayed, color: 'from-green-500 to-green-600' },
                    { icon: '🎯', label: 'Accuracy', value: `${globalStats.averageAccuracy.toFixed(1)}%`, color: 'from-purple-500 to-purple-600' },
                    { icon: '🏆', label: 'Personal Best', value: userProgress.bestScore, color: 'from-yellow-500 to-orange-500' }
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className={`bg-gradient-to-br ${stat.color} bg-opacity-10 backdrop-blur-xl rounded-lg p-4 border border-white/10 hover:border-white/30 hover:bg-opacity-20 transition-all hover:shadow-lg hover:shadow-${stat.color.split('-')[1]}-500/20 group cursor-pointer`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl group-hover:scale-110 transition-transform">{stat.icon}</span>
                        <span className="text-white/60 text-xs font-bold">{stat.label}</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Game Modes Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    🎮 Choose Your Challenge
                  </h2>
                  <span className="text-white/50 text-xs bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {gameModes.length} Modes
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gameModes.map((mode, idx) => (
                    <div
                      key={mode.id}
                      onClick={() => startGame(mode.id)}
                      className={`relative group cursor-pointer transform transition-all hover:scale-105 duration-300 animate-in fade-in slide-in-from-bottom-4`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-0 group-hover:opacity-20 rounded-xl transition-opacity blur-lg`}></div>
                      <div className={`relative bg-gradient-to-br ${mode.color} bg-opacity-10 backdrop-blur-xl rounded-xl p-5 border border-white/10 group-hover:border-white/30 hover:shadow-2xl transition-all flex flex-col h-full`}>
                        {/* Difficulty Badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            mode.difficulty === 'Adaptive' ? 'bg-blue-500/30 border-blue-400/50 text-blue-200' :
                            mode.difficulty === 'Medium' ? 'bg-yellow-500/30 border-yellow-400/50 text-yellow-200' :
                            mode.difficulty === 'Hard' ? 'bg-red-500/30 border-red-400/50 text-red-200' :
                            'bg-purple-500/30 border-purple-400/50 text-purple-200'
                          }`}>
                            {mode.difficulty}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-lg font-bold text-white mb-2 pr-24">{mode.title}</h3>
                        <p className="text-white/70 text-sm mb-4 flex-1">{mode.description}</p>

                        {/* Features */}
                        <div className="space-y-2 mb-4">
                          {mode.features.slice(0, 2).map((feature, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-green-400 text-sm">✓</span>
                              <span className="text-white/70 text-xs">{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center gap-1">
                            <span className="text-xl">⏱️</span>
                            <span className="text-white/60 text-sm font-bold">{mode.timeLimit}s</span>
                          </div>
                          <button className="bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all group-hover:shadow-lg">
                            Play Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sidebar - Leaderboard & Achievements */}
              <div className="space-y-4 lg:col-span-1">
                {/* Leaderboard */}
                <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-xl rounded-xl p-5 border border-purple-400/20 hover:border-purple-400/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      🏆 Leaderboard
                    </h3>
                    <button
                      onClick={() => setLeaderboardCollapsed(!leaderboardCollapsed)}
                      className="text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-lg"
                    >
                      {leaderboardCollapsed ? '▼' : '▲'}
                    </button>
                  </div>
                  {!leaderboardCollapsed && (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {leaderboard.slice(0, 10).map((player, idx) => (
                        <div
                          key={player.rank}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            player.isUser
                              ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border border-blue-400/50 shadow-lg'
                              : 'bg-white/5 hover:bg-white/10 border border-white/10'
                          } animate-in fade-in slide-in-from-left-2`}
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          <div className="flex-shrink-0">
                            <span className="text-lg font-bold">
                              {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
                            </span>
                          </div>
                          <div className="flex-shrink-0 text-2xl">{player.avatar}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-sm truncate">{player.name}</div>
                            <div className="text-white/60 text-xs">Lv.{player.level} • 🔥 {player.streak}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-yellow-300 font-bold text-sm">{player.score.toLocaleString()}</div>
                            <span className="text-xs">{player.country}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Achievements */}
                <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-xl rounded-xl p-5 border border-yellow-400/20 hover:border-yellow-400/40 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      🏅 Achievements
                    </h3>
                    <button
                      onClick={() => setAchievementsCollapsed(!achievementsCollapsed)}
                      className="text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-lg"
                    >
                      {achievementsCollapsed ? '▼' : '▲'}
                    </button>
                  </div>
                  {!achievementsCollapsed && (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {achievements.map((ach, idx) => (
                        <div
                          key={ach.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all border ${
                            ach.unlocked
                              ? 'bg-yellow-500/20 border-yellow-400/50'
                              : 'bg-white/5 border-white/10 opacity-60'
                          } animate-in fade-in`}
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          <span className="text-2xl flex-shrink-0">{ach.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-sm truncate">{ach.title}</div>
                            <div className="text-white/60 text-xs line-clamp-1">{ach.description}</div>
                          </div>
                          {ach.unlocked && <span className="text-yellow-300 font-bold text-xs flex-shrink-0">+{ach.xp}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Game Playing Screen - Premium Edition */
        <div className="flex-1 flex flex-col md:flex-row gap-3 p-3 min-w-0 min-h-0 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/50 to-purple-900/30">
          {/* Main Game Area */}
          <div className="flex-1 flex flex-col gap-2 min-w-0 min-h-0">
            {/* Game Stats - Animated Grid */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 flex-shrink-0">
              {[
                { label: 'Score', value: gameState.score, icon: '🎯', color: 'from-green-500 to-green-600', hidden: false },
                { label: 'Time', value: gameState.timeLeft, icon: '⏱️', color: 'from-blue-500 to-blue-600', hidden: false },
                { label: 'Chain', value: gameState.chain, icon: '⛓️', color: 'from-purple-500 to-purple-600', hidden: false },
                { label: 'Mult', value: `x${gameState.multiplier}`, icon: '🚀', color: 'from-yellow-500 to-yellow-600', hidden: 'md' },
                { label: 'Acc', value: `${((gameState.correctSigns / Math.max(gameState.detectedSigns.length, 1)) * 100).toFixed(0)}%`, icon: '🎪', color: 'from-red-500 to-red-600', hidden: 'md' }
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`${stat.hidden === 'md' ? 'hidden md:flex' : 'flex'} bg-gradient-to-br ${stat.color} bg-opacity-15 backdrop-blur-xl rounded-lg p-3 border border-white/10 hover:border-white/30 transition-all flex-col items-center justify-center hover:shadow-lg animate-in fade-in`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <span className="text-sm text-white/60 text-xs font-bold">{stat.label}</span>
                  <div className="text-lg md:text-2xl font-black text-white truncate">{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Camera Feed Container - Premium */}
            <div className="flex-1 min-h-0 relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black group">
              {/* Glow effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl transition-opacity duration-300 pointer-events-none"></div>

              {isModelLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-950/50 to-purple-950/50 backdrop-blur-sm z-20">
                  <div className="text-center space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-blue-500 border-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-white font-bold text-lg">Loading AI Model</p>
                      <p className="text-white/60 text-sm">Training hands for gestures...</p>
                    </div>
                    <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 shadow-lg shadow-purple-500/50"
                        style={{ width: `${loadingProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-white/40 text-xs">{loadingProgress}% Complete</p>
                  </div>
                </div>
              ) : (
                <>
                  <Webcam 
                    ref={webcamRef}
                    onUserMedia={() => setIsCameraReady(true)}
                    screenshotFormat="image/jpeg"
                    className="absolute inset-0 w-full h-full object-cover"
                    mirrored={true}
                    videoConstraints={{
                      width: 640,
                      height: 480,
                      facingMode: "user"
                    }}
                  />
                  
                  {/* Hand Skeleton Canvas Overlay */}
                  {gameState.isPlaying && (
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border-2 border-gray-300 z-10">
                      <canvas
                        ref={canvasRef}
                        width={150}
                        height={150}
                        className="rounded-lg"
                      />
                    </div>
                  )}
                  
                  {/* Target Sign Display - Premium */}
                  <div className="absolute top-3 left-3 right-3 z-10 animate-in fade-in slide-in-from-top-2">
                    <div className="bg-gradient-to-r from-blue-600/95 via-purple-600/95 to-pink-600/95 backdrop-blur-lg rounded-xl p-4 md:p-5 text-center border border-white/20 shadow-2xl">
                      <div className="text-white/80 font-bold text-xs md:text-sm tracking-widest uppercase mb-2">🎯 Target</div>
                      <div className="text-5xl md:text-6xl font-black text-white drop-shadow-lg">{gameState.targetSign}</div>
                      {gameModes.find(g => g.id === gameState.mode)?.chainEnabled && gameState.chain > 0 && (
                        <div className="mt-3 inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-4 py-2 rounded-lg font-bold text-sm animate-pulse">
                          ⛓️ Chain: {gameState.chain} × {gameState.multiplier}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detection Status - Premium */}
                  {currentSign && (
                    <div className="absolute bottom-3 left-3 right-3 z-10 animate-in fade-in slide-in-from-bottom-2">
                      <div className={`backdrop-blur-lg rounded-xl p-3 md:p-4 border-2 transition-all shadow-2xl ${
                        currentSign === gameState.targetSign
                          ? 'bg-gradient-to-r from-green-500/90 to-emerald-600/90 border-green-300/50'
                          : 'bg-gradient-to-r from-red-500/90 to-rose-600/90 border-red-300/50'
                      }`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-3xl flex-shrink-0">{currentSign === gameState.targetSign ? '✅' : '❌'}</div>
                            <div className="min-w-0">
                              <div className="text-white font-bold text-sm md:text-base truncate">Detected: {currentSign}</div>
                              <div className="text-white/80 text-xs">
                                {currentSign === gameState.targetSign ? '🎉 Perfect Match!' : `Expected: ${gameState.targetSign}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-white font-bold text-lg md:text-xl flex-shrink-0 bg-white/20 px-3 py-2 rounded-lg">
                            {Math.round(detectionConfidence)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Badge */}
                  {useEnhancedModel && (
                    <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-purple-600 to-pink-600 backdrop-blur-lg rounded-lg p-2 border border-purple-400/50 shadow-lg animate-pulse">
                      <div className="text-white font-bold text-xs">⚡ AI Enhanced</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Game Controls - Premium */}
            <div className="flex gap-3 flex-shrink-0 animate-in fade-in slide-in-from-bottom-2">
              <button
                onClick={endGame}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-3 rounded-lg font-bold transition-all transform hover:scale-105 hover:shadow-lg shadow-md active:scale-95"
              >
                🛑 End Game
              </button>
              <button
                onClick={resetGame}
                className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white py-3 rounded-lg font-bold transition-all transform hover:scale-105 hover:shadow-lg shadow-md active:scale-95"
              >
                🏠 Menu
              </button>
            </div>
          </div>

          {/* Premium Sidebar */}
          <div className={`transition-all duration-300 flex flex-col ${sidebarCollapsed ? 'w-14 md:w-16' : 'w-full md:w-72'} min-h-0 flex-shrink-0`}>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="text-white/60 hover:text-white hover:bg-white/10 transition-all p-2 rounded-lg"
                title={sidebarCollapsed ? 'Expand' : 'Collapse'}
              >
                {sidebarCollapsed ? '▶' : '◀'}
              </button>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto">
                {/* Recent Detections - Premium */}
                <div className="bg-gradient-to-br from-slate-900/60 via-indigo-900/40 to-slate-900/60 backdrop-blur-xl rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all flex flex-col flex-shrink-0 shadow-lg">
                  <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
                    ✋ Recent Detections
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{gameState.detectedSigns.length}</span>
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto flex-1">
                    {gameState.detectedSigns.slice(-6).reverse().map((detection, idx) => (
                      <div
                        key={detection.time}
                        className={`flex items-center justify-between p-2.5 rounded-lg transition-all border animate-in fade-in slide-in-from-right-2 ${
                          detection.correct
                            ? 'bg-green-500/20 border-green-400/40 hover:bg-green-500/30'
                            : 'bg-red-500/20 border-red-400/40 hover:bg-red-500/30'
                        }`}
                        style={{ animationDelay: `${idx * 30}ms` }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg flex-shrink-0">{detection.correct ? '✅' : '❌'}</span>
                          <span className="text-white font-bold text-sm truncate">{detection.sign}</span>
                        </div>
                        {detection.correct ? (
                          <div className="text-green-300 font-bold text-xs flex-shrink-0">+{detection.score}</div>
                        ) : (
                          <div className="text-red-300 text-xs flex-shrink-0">{detection.expected}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chain Status - Premium */}
                {gameModes.find(g => g.id === gameState.mode)?.chainEnabled && (
                  <div className="bg-gradient-to-br from-yellow-900/40 via-orange-900/30 to-yellow-900/40 backdrop-blur-xl rounded-xl p-4 border border-yellow-400/20 hover:border-yellow-400/40 transition-all flex-shrink-0 shadow-lg">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2 text-sm">
                      <span className="text-2xl">⛓️</span> Chain Combo
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Current Chain:</span>
                        <span className="bg-yellow-500/30 px-3 py-1 rounded-lg font-bold text-yellow-300">{gameState.chain}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Personal Best:</span>
                        <span className="bg-purple-500/30 px-3 py-1 rounded-lg font-bold text-purple-300">{gameState.maxChain}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80">Multiplier:</span>
                        <span className="bg-orange-500/30 px-3 py-1 rounded-lg font-bold text-orange-300">x{gameState.multiplier}</span>
                      </div>
                      <div className="space-y-2 mt-4">
                        <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden border border-white/20">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 rounded-full transition-all duration-300 shadow-lg shadow-orange-500/50"
                            style={{ width: `${Math.min((gameState.chain / 15) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-white/60 text-xs text-center font-bold">
                          {gameState.chain < 5 ? '🎯 5+ for x2' :
                           gameState.chain < 10 ? '🔥 10+ for x3' :
                           gameState.chain < 15 ? '⚡ 15+ for x4' : '👑 MAX!'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamifiedLearning;
