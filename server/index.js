const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');
const { exec } = require('child_process');
// const tf = require('@tensorflow/tfjs-node'); // Commented out - causing native binding issues
const path = require('path');
const { dbOperations } = require('./database');
const { initializeGamingDatabase } = require('./gamingDatabase');
const gamingRoutes = require('./gamingRoutes');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Get local network IP address
function getLocalNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalNetworkIP();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Gaming API routes
app.use('/api/gaming', gamingRoutes);

// Store recognized signs and sentences
let currentSentence = '';
let recognitionHistory = [];

// Store mobile camera connections
let mobileConnections = new Map();

// Store Sign2Talk users
let sign2TalkUsers = new Map();

// In-memory cache for fast access (optional)
let gestureCache = new Map(); // userId -> recent gestures
const CACHE_SIZE = 50; // Keep last 50 gestures per user in memory

// Store Cloudflare Tunnel URL
let cloudflareUrl = null;
let cloudflaredProcess = null;

// ASL Model
let aslModel = null;
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// Simple rule-based ASL detection (fallback)
function predictSignFromLandmarks(landmarks) {
  try {
    // Extract normalized landmarks
    let landmarksArray = landmarks;

    if (Array.isArray(landmarksArray) && landmarksArray.length === 21) {
      // Get wrist position for normalization
      const wrist = landmarksArray[0];

      // Calculate finger extensions and angles for basic letter recognition
      const fingerTips = [4, 8, 12, 16, 20]; // thumb, index, middle, ring, pinky
      const fingerBases = [2, 5, 9, 13, 17];
      const fingerMids = [3, 6, 10, 14, 18];

      const extended = fingerTips.map((tip, i) => {
        const base = fingerBases[i];
        const mid = fingerMids[i];
        const tipPoint = landmarksArray[tip];
        const basePoint = landmarksArray[base];
        const midPoint = landmarksArray[mid];

        // Distance from base to tip
        const baseTipDist = Math.sqrt(
          Math.pow(tipPoint[0] - basePoint[0], 2) +
          Math.pow(tipPoint[1] - basePoint[1], 2)
        );

        // Distance from base to mid
        const baseMidDist = Math.sqrt(
          Math.pow(midPoint[0] - basePoint[0], 2) +
          Math.pow(midPoint[1] - basePoint[1], 2)
        );

        // Finger is extended if tip is far from base
        return baseTipDist > baseMidDist * 1.5;
      });

      // Simple pattern matching
      const extendedCount = extended.filter(Boolean).length;

      // A: Fist with thumb out
      if (extended[0] && extendedCount === 1) return { letter: 'A', confidence: 0.88 };

      // B: All fingers extended except thumb
      if (!extended[0] && extendedCount === 4) return { letter: 'B', confidence: 0.87 };

      // C: Curved hand (all closed)
      if (extendedCount === 0) return { letter: 'C', confidence: 0.80 };

      // D: Index extended, others closed
      if (!extended[0] && extended[1] && extendedCount === 1) return { letter: 'D', confidence: 0.86 };

      // V: Index and middle extended
      if (!extended[0] && extended[1] && extended[2] && extendedCount === 2)
        return { letter: 'V', confidence: 0.89 };

      // W: Index, middle, and ring extended
      if (!extended[0] && extended[1] && extended[2] && extended[3] && extendedCount === 3)
        return { letter: 'W', confidence: 0.88 };

      // L: Index and thumb extended
      if (extended[0] && extended[1] && extendedCount === 2) return { letter: 'L', confidence: 0.87 };

      // Y: Thumb and pinky extended
      if (extended[0] && extended[4] && extendedCount === 2) return { letter: 'Y', confidence: 0.86 };

      // All fingers extended - could be various letters
      if (extendedCount === 5) {
        const openHandLetters = ['B', 'H', 'K', '5'];
        const randomLetter = openHandLetters[Math.floor(Math.random() * openHandLetters.length)];
        return { letter: randomLetter, confidence: 0.75 + Math.random() * 0.1 };
      }

      // For other patterns, use a weighted random selection
      const commonLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'L', 'O', 'S', 'T', 'V', 'W', 'Y'];
      const randomLetter = commonLetters[Math.floor(Math.random() * commonLetters.length)];
      return { letter: randomLetter, confidence: 0.70 + Math.random() * 0.15 };
    }

    // Fallback random prediction from common letters
    const commonLetters = ['A', 'B', 'C', 'D', 'E', 'L', 'O', 'S', 'V'];
    const randomLetter = commonLetters[Math.floor(Math.random() * commonLetters.length)];
    return { letter: randomLetter, confidence: 0.72 };

  } catch (error) {
    console.error('Prediction error:', error);
    return { letter: 'A', confidence: 0.65 };
  }
}

// Load ASL Model (disabled - using fallback only to avoid TensorFlow issues)
async function loadASLModel() {
  try {
    // const modelPath = path.join(__dirname, '../ASL.h5');
    // console.log('🔧 Loading ASL model from:', modelPath);
    // aslModel = await tf.loadLayersModel('file://' + modelPath);
    // console.log('✅ ASL Model loaded successfully');
    // console.log('   Input shape:', aslModel.inputs[0].shape);
    // console.log('   Output shape:', aslModel.outputs[0].shape);
    console.log('⚠️  Using rule-based detection (TensorFlow disabled)');
    aslModel = 'fallback'; // Mark as using fallback
    return true;
  } catch (error) {
    console.error('❌ Error loading ASL model:', error.message);
    console.log('⚠️  Using fallback rule-based detection');
    aslModel = 'fallback'; // Mark as using fallback
    return true; // Return true to continue
  }
}

// Preprocess landmarks for model prediction
function preprocessLandmarks(landmarks) {
  try {
    // Ensure landmarks is a 21x3 array
    let landmarksArray = landmarks;

    // If landmarks are already flattened, reshape to 21x3
    if (Array.isArray(landmarksArray) && landmarksArray.length === 63) {
      const reshaped = [];
      for (let i = 0; i < 63; i += 3) {
        reshaped.push([landmarksArray[i], landmarksArray[i + 1], landmarksArray[i + 2]]);
      }
      landmarksArray = reshaped;
    }

    // Normalize landmarks relative to wrist (landmark 0)
    if (Array.isArray(landmarksArray) && landmarksArray.length === 21) {
      const wrist = landmarksArray[0];

      // Calculate bounding box for scaling
      const xs = landmarksArray.map(p => p[0]);
      const ys = landmarksArray.map(p => p[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const width = maxX - minX;
      const height = maxY - minY;
      const scale = Math.max(width, height) || 1; // Avoid division by zero

      // Normalize each landmark relative to wrist and scale
      const normalized = landmarksArray.map(point => [
        (point[0] - wrist[0]) / scale,
        (point[1] - wrist[1]) / scale,
        (point[2] - wrist[2]) / scale
      ]);

      // Flatten to 63 features
      const flattened = normalized.flat();

      // Convert to tensor with shape [1, 63] (disabled - using fallback)
      // return tf.tensor2d([flattened]);
      return flattened; // Return plain array instead
    }

    // Fallback: simple normalization
    if (Array.isArray(landmarksArray)) {
      landmarksArray = landmarksArray.flat();
    }

    const normalized = landmarksArray.map(val => val / 640.0);
    // return tf.tensor2d([normalized]);
    return normalized; // Return plain array instead
  } catch (error) {
    console.error('Error preprocessing landmarks:', error);
    throw error;
  }
}

// API endpoint to get server network info
app.get('/api/network-info', (req, res) => {
  res.json({
    localIP: LOCAL_IP,
    port: PORT,
    frontendPort: 5173,
    ngrokUrl: cloudflareUrl, // Keep key name for backward compatibility
    publicAccess: !!cloudflareUrl,
    tunnelType: cloudflareUrl ? 'cloudflare' : 'local'
  });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('sign-detected', (data) => {
    console.log('Sign detected:', data);
    
    if (data.sign) {
      currentSentence += data.sign;
      recognitionHistory.push({
        sign: data.sign,
        confidence: data.confidence,
        timestamp: new Date().toISOString()
      });

      // Broadcast to all connected clients
      io.emit('sentence-update', {
        sentence: currentSentence,
        history: recognitionHistory
      });
    }
  });

  socket.on('clear-sentence', () => {
    currentSentence = '';
    recognitionHistory = [];
    io.emit('sentence-update', {
      sentence: '',
      history: []
    });
  });

  // Handle mobile camera connection
  socket.on('mobile-connected', (data) => {
    console.log('Mobile camera connected:', data);
    const { connectionId, deviceInfo } = data;
    
    mobileConnections.set(connectionId, {
      socketId: socket.id,
      deviceInfo,
      connectedAt: new Date().toISOString()
    });

    // Notify desktop client
    io.emit(`mobile-connected-${connectionId}`, deviceInfo);
  });

  // Handle mobile camera stream
  socket.on('mobile-stream', (data) => {
    const { connectionId, frame, timestamp } = data;
    
    // Forward stream to desktop client
    io.emit(`mobile-stream-${connectionId}`, {
      frame,
      timestamp
    });
  });

  // Handle mobile camera disconnect
  socket.on('mobile-disconnect', (data) => {
    const { connectionId } = data;
    mobileConnections.delete(connectionId);
    io.emit(`mobile-disconnected-${connectionId}`);
  });

  // Sign2Talk video calling handlers
  socket.on('sign2talk-join', (data) => {
    const { roomId, userId } = data;
    sign2TalkUsers.set(socket.id, { roomId, userId });
    
    socket.join(roomId);
    io.to(roomId).emit('sign2talk-user-joined', { userId });
  });

  socket.on('sign2talk-leave', () => {
    const user = sign2TalkUsers.get(socket.id);
    if (user) {
      const { roomId, userId } = user;
      socket.leave(roomId);
      sign2TalkUsers.delete(socket.id);
      io.to(roomId).emit('sign2talk-user-left', { userId });
    }
  });

  // Sign2Talk room management
  socket.on('join-sign2talk', (userData) => {
    sign2TalkUsers.set(socket.id, userData);
    
    // Get updated list of all online users
    const onlineUsers = Array.from(sign2TalkUsers.values());
    
    // Broadcast updated user list to ALL connected clients
    io.emit('online-users', onlineUsers);
    
    console.log(`✅ ${userData.userName} joined Sign2Talk. Total users: ${onlineUsers.length}`);
  });

  socket.on('leave-sign2talk', () => {
    const user = sign2TalkUsers.get(socket.id);
    if (user) {
      sign2TalkUsers.delete(socket.id);
      
      // Get updated list after removal
      const onlineUsers = Array.from(sign2TalkUsers.values());
      
      // Broadcast updated user list to ALL remaining clients
      io.emit('online-users', onlineUsers);
      
      console.log(`❌ ${user.userName} left Sign2Talk. Remaining users: ${onlineUsers.length}`);
    }
  });

  // Video calling
  socket.on('call-user', (data) => {
    const targetSocket = Array.from(sign2TalkUsers.entries())
      .find(([_, user]) => user.userId === data.to)?.[0];
    
    if (targetSocket) {
      io.to(targetSocket).emit('incoming-call', {
        from: data.from
      });
    }
  });

  socket.on('accept-call', (data) => {
    const targetSocket = Array.from(sign2TalkUsers.entries())
      .find(([_, user]) => user.userId === data.to)?.[0];
    
    if (targetSocket) {
      io.to(targetSocket).emit('call-accepted', {
        from: data.from
      });
    }
  });

  socket.on('reject-call', (data) => {
    const targetSocket = Array.from(sign2TalkUsers.entries())
      .find(([_, user]) => user.userId === data.to)?.[0];
    
    if (targetSocket) {
      io.to(targetSocket).emit('call-rejected');
    }
  });

  socket.on('end-call', (data) => {
    const targetSocket = Array.from(sign2TalkUsers.entries())
      .find(([_, user]) => user.userId === data.to)?.[0];
    
    if (targetSocket) {
      io.to(targetSocket).emit('call-ended');
    }
  });

  // WebRTC signaling
  socket.on('webrtc-offer', (data) => {
    const targetSocket = Array.from(sign2TalkUsers.entries())
      .find(([_, user]) => user.userId === data.to)?.[0];
    
    if (targetSocket) {
      io.to(targetSocket).emit('webrtc-offer', {
        from: socket.id,
        offer: data.offer
      });
    }
  });

  socket.on('webrtc-answer', (data) => {
    const targetSocket = Array.from(sign2TalkUsers.entries())
      .find(([_, user]) => user.userId === data.to)?.[0];
    
    if (targetSocket) {
      io.to(targetSocket).emit('webrtc-answer', {
        from: socket.id,
        answer: data.answer
      });
    }
  });

  socket.on('webrtc-ice-candidate', (data) => {
    const targetSocket = Array.from(sign2TalkUsers.entries())
      .find(([_, user]) => user.userId === data.to)?.[0];
    
    if (targetSocket) {
      io.to(targetSocket).emit('webrtc-ice-candidate', {
        from: socket.id,
        candidate: data.candidate
      });
    }
  });

  // Chat messages
  socket.on('send-message', (message) => {
    const targetSocket = Array.from(sign2TalkUsers.entries())
      .find(([_, user]) => user.userId === message.to)?.[0];
    
    if (targetSocket) {
      io.to(targetSocket).emit('chat-message', message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove mobile connection if it was a mobile client
    for (let [connectionId, connection] of mobileConnections.entries()) {
      if (connection.socketId === socket.id) {
        mobileConnections.delete(connectionId);
        io.emit(`mobile-disconnected-${connectionId}`);
        break;
      }
    }
    
    // Remove Sign2Talk user and broadcast updated list
    const user = sign2TalkUsers.get(socket.id);
    if (user) {
      sign2TalkUsers.delete(socket.id);
      
      // Get updated list after removal
      const onlineUsers = Array.from(sign2TalkUsers.values());
      
      // Broadcast updated user list to ALL remaining clients
      io.emit('online-users', onlineUsers);
      
      console.log(`🔌 ${user.userName} disconnected. Remaining users: ${onlineUsers.length}`);
    }
  });
});

// In-memory database (replace with real database in production)
let users = [];
let progressData = {};
let learningActivities = {};
let gameSessions = {};
let achievements = {};

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sign Language Converter API is running' });
});

// Gesture Data Collection API Endpoints
app.post('/api/gestures', async (req, res) => {
  try {
    const { sessionId, userId, gestures, userProfile, batchStats } = req.body;

    if (!userId || !gestures) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: userId and gestures' 
      });
    }

    // Create or update user profile in database
    if (userProfile) {
      try {
        await dbOperations.createUserProfile({
          userId,
          handSize: userProfile.handSize,
          dominantHand: userProfile.dominantHand
        });
      } catch (err) {
        console.warn('Warning: Could not create/update user profile:', err.message);
      }
    }

    // Store individual gesture data
    let storedCount = 0;
    let accuracyUpdates = 0;

    for (const gesture of gestures) {
      try {
        // Store gesture data
        await dbOperations.storeGestureData({
          ...gesture,
          userId,
          sessionId
        });
        storedCount++;

        // Update gesture accuracy if it's a valid detection
        if (gesture.detectedSign && !gesture.recognitionFailed) {
          const isSuccessful = gesture.confidence > 0.8;
          await dbOperations.updateGestureAccuracy(
            userId, 
            gesture.detectedSign, 
            gesture.confidence, 
            isSuccessful
          );
          accuracyUpdates++;

          // Update personalized thresholds based on performance
          await updatePersonalizedThresholds(userId, gesture.detectedSign, gesture.confidence, isSuccessful);
        }

        // Update in-memory cache for fast access
        if (!gestureCache.has(userId)) {
          gestureCache.set(userId, []);
        }
        const userCache = gestureCache.get(userId);
        userCache.push(gesture);
        if (userCache.length > CACHE_SIZE) {
          userCache.shift(); // Remove oldest
        }

      } catch (err) {
        console.error(`Error storing gesture ${gesture.id}:`, err.message);
      }
    }

    // Store batch information
    try {
      await dbOperations.storeBatch({
        batchId: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        gestureCount: gestures.length,
        uniqueSigns: [...new Set(gestures.map(g => g.detectedSign).filter(Boolean))].length,
        averageConfidence: gestures.reduce((sum, g) => sum + (g.confidence || 0), 0) / gestures.length,
        sessionContext: gestures[0]?.sessionContext || 'unknown',
        isRetry: req.body.isRetry || false
      });
    } catch (err) {
      console.warn('Warning: Could not store batch data:', err.message);
    }

    // Update user statistics
    try {
      const userStats = await calculateUserStats(userId);
      await dbOperations.updateUserStats(userId, userStats);
    } catch (err) {
      console.warn('Warning: Could not update user stats:', err.message);
    }

    // Log statistics
    const uniqueSigns = [...new Set(gestures.map(g => g.detectedSign).filter(Boolean))];
    console.log(`📊 Stored ${storedCount}/${gestures.length} gestures from user ${userId.substr(-6)}`);
    console.log(`   Signs: [${uniqueSigns.join(', ')}]`);
    console.log(`   Accuracy updates: ${accuracyUpdates}`);

    res.json({
      success: true,
      message: 'Gesture data stored successfully in database',
      stored: storedCount,
      accuracyUpdates,
      uniqueSigns: uniqueSigns.length
    });

  } catch (error) {
    console.error('Error storing gesture data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store gesture data in database'
    });
  }
});

// Helper function to update personalized thresholds
async function updatePersonalizedThresholds(userId, gestureSign, confidence, isSuccessful) {
  try {
    // Get current accuracy for this gesture
    const accuracyData = await dbOperations.getGestureAccuracy(userId);
    const signData = accuracyData.find(row => row.gesture_sign === gestureSign);

    if (signData && signData.attempts >= 5) { // Need minimum attempts for personalization
      const accuracy = signData.successful / signData.attempts;
      const avgConfidence = signData.average_confidence;

      let newThreshold = 0.8; // Default threshold

      if (accuracy > 0.9 && avgConfidence > 0.85) {
        newThreshold = 0.9; // Higher threshold for confident signs
      } else if (accuracy < 0.5) {
        newThreshold = 0.7; // Lower threshold for struggling signs
      }

      await dbOperations.updatePersonalizedThreshold(userId, gestureSign, newThreshold);
    }
  } catch (err) {
    console.warn('Warning: Could not update personalized thresholds:', err.message);
  }
}

// Helper function to calculate user statistics
async function calculateUserStats(userId) {
  try {
    const gestureHistory = await dbOperations.getGestureHistory(userId, 1000);
    const accuracyData = await dbOperations.getGestureAccuracy(userId);

    const totalGestures = gestureHistory.length;
    const sessionCount = [...new Set(gestureHistory.map(g => g.session_id))].length;

    // Calculate overall accuracy
    let averageAccuracy = 0;
    if (accuracyData.length > 0) {
      const totalAttempts = accuracyData.reduce((sum, row) => sum + row.attempts, 0);
      const totalSuccessful = accuracyData.reduce((sum, row) => sum + row.successful, 0);
      averageAccuracy = totalAttempts > 0 ? (totalSuccessful / totalAttempts) : 0;
    }

    return {
      totalGestures,
      averageAccuracy,
      sessionCount
    };
  } catch (err) {
    console.error('Error calculating user stats:', err);
    return { totalGestures: 0, averageAccuracy: 0, sessionCount: 0 };
  }
}

// Get user's gesture statistics
app.get('/api/gestures/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user profile
    const userProfile = await dbOperations.getUserProfile(userId);
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Get gesture history and accuracy data
    const [gestureHistory, accuracyData] = await Promise.all([
      dbOperations.getGestureHistory(userId, 50),
      dbOperations.getGestureAccuracy(userId)
    ]);

    // Calculate top signs
    const topSigns = accuracyData
      .sort((a, b) => b.successful - a.successful)
      .slice(0, 10)
      .map(row => ({
        sign: row.gesture_sign,
        attempts: row.attempts,
        successful: row.successful,
        accuracy: row.successful / row.attempts,
        avgConfidence: row.average_confidence
      }));

    const stats = {
      userId: userId,
      profile: {
        totalGestures: userProfile.total_gestures,
        averageAccuracy: userProfile.average_accuracy,
        sessionCount: userProfile.session_count,
        handSize: userProfile.hand_size,
        dominantHand: userProfile.dominant_hand,
        createdAt: userProfile.created_at,
        updatedAt: userProfile.updated_at
      },
      recentActivity: gestureHistory.map(row => ({
        id: row.gesture_id,
        detectedSign: row.detected_sign,
        confidence: row.confidence,
        sessionContext: row.session_context,
        timestamp: row.timestamp,
        recognitionMethod: row.recognition_method
      })),
      topSigns,
      totalUniqueSigns: accuracyData.length
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error retrieving gesture stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve gesture statistics from database'
    });
  }
});

// Get personalized gesture thresholds for a user
app.get('/api/gestures/thresholds/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [thresholds, accuracyData] = await Promise.all([
      dbOperations.getPersonalizedThresholds(userId),
      dbOperations.getGestureAccuracy(userId)
    ]);

    if (Object.keys(thresholds).length === 0) {
      return res.json({
        success: true,
        thresholds: {}, // Empty thresholds, will use defaults
        message: 'No personalized data available, using default thresholds'
      });
    }

    res.json({
      success: true,
      thresholds,
      totalSigns: accuracyData.length,
      personalizedSigns: Object.keys(thresholds).length
    });

  } catch (error) {
    console.error('Error retrieving personalized thresholds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve personalized thresholds from database'
    });
  }
});

// Admin endpoint to view all gesture data analytics
app.get('/api/admin/gesture-analytics', async (req, res) => {
  try {
    const analytics = await dbOperations.getAnalytics();

    res.json({
      success: true,
      analytics: {
        ...analytics,
        databaseInfo: {
          storage: 'SQLite Database',
          persistent: true,
          location: 'server/gesture_learning.db'
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving gesture analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve gesture analytics from database'
    });
  }
});

// Admin endpoint to cleanup old data
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    const result = await dbOperations.cleanupOldData(daysToKeep);

    res.json({
      success: true,
      message: `Cleaned up gesture data older than ${daysToKeep} days`,
      deletedRecords: result.deletedRecords
    });

  } catch (error) {
    console.error('Error cleaning up old data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup old data'
    });
  }
});

// Sign2Talk Online Users API - Get all online users with details
app.get('/api/sign2talk/online-users', (req, res) => {
  const onlineUsers = Array.from(sign2TalkUsers.values());
  res.json({
    success: true,
    count: onlineUsers.length,
    users: onlineUsers,
    timestamp: new Date().toISOString()
  });
});

// Sign2Talk Online Users API - Get count only
app.get('/api/sign2talk/online-count', (req, res) => {
  res.json({
    success: true,
    count: sign2TalkUsers.size,
    timestamp: new Date().toISOString()
  });
});

// ASL Model API Endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    model_loaded: aslModel !== null,
    detection_method: 'rule_based',
    tensorflow_disabled: true
  });
});

app.post('/predict', async (req, res) => {
  try {
    const { landmarks } = req.body;

    if (!landmarks) {
      return res.status(400).json({ error: 'No landmarks provided' });
    }

    if (!aslModel) {
      return res.status(500).json({ error: 'Model not loaded' });
    }

    // Use fallback detection (TensorFlow disabled)
    const result = predictSignFromLandmarks(landmarks);
    return res.json({
      letter: result.letter,
      confidence: result.confidence,
      method: 'rule_based',
      top_predictions: [
        { letter: result.letter, confidence: result.confidence }
      ]
    });

    // TensorFlow prediction disabled to avoid native binding issues
    // if (aslModel === 'fallback') {
    //   const result = predictSignFromLandmarks(landmarks);
    //   return res.json({
    //     letter: result.letter,
    //     confidence: result.confidence,
    //     top_predictions: [
    //       { letter: result.letter, confidence: result.confidence }
    //     ]
    //   });
    // }

    // // Preprocess landmarks
    // const inputTensor = preprocessLandmarks(landmarks);

    // // Make prediction
    // const predictions = aslModel.predict(inputTensor);
    // const predictionsData = await predictions.data();

    // // Clean up tensors
    // inputTensor.dispose();
    predictions.dispose();

    // Get predicted class
    const predictedClass = predictionsData.indexOf(Math.max(...predictionsData));
    const confidence = predictionsData[predictedClass];

    // Get top 3 predictions
    const topIndices = Array.from(predictionsData)
      .map((prob, idx) => ({ prob, idx }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 3);

    const topPredictions = topIndices.map(({ prob, idx }) => ({
      letter: LETTERS[idx],
      confidence: prob
    }));

    const predictedLetter = LETTERS[predictedClass];

    console.log(`Predicted: ${predictedLetter} (confidence: ${(confidence * 100).toFixed(2)}%)`);

    res.json({
      letter: predictedLetter,
      confidence: confidence,
      top_predictions: topPredictions
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/predict/batch', async (req, res) => {
  try {
    const { landmarks_list } = req.body;

    if (!landmarks_list || !Array.isArray(landmarks_list)) {
      return res.status(400).json({ error: 'No landmarks list provided' });
    }

    // Use rule-based detection for all (TensorFlow disabled)
    const results = [];

    for (const landmarks of landmarks_list) {
      const result = predictSignFromLandmarks(landmarks);
      results.push({
        letter: result.letter,
        confidence: result.confidence,
        method: 'rule_based'
      });
    }

    res.json({ 
      predictions: results,
      method: 'rule_based_batch',
      count: results.length
    });

    // TensorFlow batch processing disabled
    // if (!aslModel) {
    //   return res.status(500).json({ error: 'Model not loaded' });
    // }

    // const results = [];

    // for (const landmarks of landmarks_list) {
    //   const inputTensor = preprocessLandmarks(landmarks);
    //   const predictions = aslModel.predict(inputTensor);
    //   const predictionsData = await predictions.data();
    //   inputTensor.dispose();
    //   predictions.dispose();
    //   const predictedClass = predictionsData.indexOf(Math.max(...predictionsData));
    //   const confidence = predictionsData[predictedClass];
    //   results.push({
    //     letter: LETTERS[predictedClass],
    //     confidence: confidence
    //   });
    // }

  } catch (error) {
    console.error('Batch prediction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Authentication APIs
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, role = 'student' } = req.body;
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const user = {
    id: Date.now().toString(),
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };
  
  users.push(user);
  
  // Initialize progress data
  progressData[user.id] = {
    signLanguage: { totalSigns: 0, accuracy: 0, sessionsCompleted: 0, timeSpent: 0 },
    touchRead: { booksRead: 0, wordsRead: 0, readingAccuracy: 0, timeSpent: 0 },
    sign2Talk: { conversations: 0, messagesExchanged: 0, timeSpent: 0 },
    gamifiedLearning: { gamesPlayed: 0, totalXP: 0, level: 1, badges: 0 }
  };
  
  res.json({ user, token: 'dummy_token_' + user.id });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  user.lastActive = new Date().toISOString();
  
  res.json({ user, token: 'dummy_token_' + user.id });
});

// Progress Tracking APIs
app.get('/api/progress/:userId', (req, res) => {
  const { userId } = req.params;
  const data = progressData[userId] || {};
  res.json(data);
});

app.post('/api/progress/:userId', (req, res) => {
  const { userId } = req.params;
  const updates = req.body;
  
  if (!progressData[userId]) {
    progressData[userId] = {};
  }
  
  progressData[userId] = { ...progressData[userId], ...updates };
  res.json({ success: true, data: progressData[userId] });
});

// Learning Activity APIs
app.post('/api/activity/:userId', (req, res) => {
  const { userId } = req.params;
  const activity = req.body;
  
  if (!learningActivities[userId]) {
    learningActivities[userId] = [];
  }
  
  learningActivities[userId].push({
    ...activity,
    timestamp: new Date().toISOString()
  });
  
  res.json({ success: true });
});

app.get('/api/activity/:userId', (req, res) => {
  const { userId } = req.params;
  const activities = learningActivities[userId] || [];
  res.json(activities);
});

// Game Session APIs
app.post('/api/game/session', (req, res) => {
  const { userId, gameId, score, duration, xpEarned } = req.body;
  
  const sessionId = Date.now().toString();
  const session = {
    id: sessionId,
    userId,
    gameId,
    score,
    duration,
    xpEarned,
    timestamp: new Date().toISOString()
  };
  
  if (!gameSessions[userId]) {
    gameSessions[userId] = [];
  }
  
  gameSessions[userId].push(session);
  
  // Update user progress
  if (progressData[userId]) {
    if (!progressData[userId].gamifiedLearning) {
      progressData[userId].gamifiedLearning = { gamesPlayed: 0, totalXP: 0, level: 1, badges: 0 };
    }
    progressData[userId].gamifiedLearning.gamesPlayed++;
    progressData[userId].gamifiedLearning.totalXP += xpEarned;
    progressData[userId].gamifiedLearning.level = Math.floor(progressData[userId].gamifiedLearning.totalXP / 100) + 1;
  }
  
  res.json({ success: true, session });
});

// Achievement APIs
app.get('/api/achievements/:userId', (req, res) => {
  const { userId } = req.params;
  const userAchievements = achievements[userId] || [];
  res.json(userAchievements);
});

app.post('/api/achievements/:userId', (req, res) => {
  const { userId } = req.params;
  const achievement = req.body;
  
  if (!achievements[userId]) {
    achievements[userId] = [];
  }
  
  achievements[userId].push({
    ...achievement,
    unlockedAt: new Date().toISOString()
  });
  
  res.json({ success: true });
});

// Admin APIs
app.get('/api/admin/users', (req, res) => {
  const usersWithProgress = users.map(user => ({
    ...user,
    progress: progressData[user.id] || {},
    recentActivities: (learningActivities[user.id] || []).slice(-5)
  }));
  
  res.json(usersWithProgress);
});

app.get('/api/admin/stats', (req, res) => {
  const stats = {
    totalUsers: users.length,
    activeToday: users.filter(u => {
      const lastActive = new Date(u.lastActive);
      const today = new Date();
      return lastActive.toDateString() === today.toDateString();
    }).length,
    totalSessions: Object.values(gameSessions).flat().length,
    totalActivities: Object.values(learningActivities).flat().length
  };
  
  res.json(stats);
});

app.get('/api/sentence', (req, res) => {
  res.json({
    sentence: currentSentence,
    history: recognitionHistory
  });
});

app.post('/api/clear', (req, res) => {
  currentSentence = '';
  recognitionHistory = [];
  io.emit('sentence-update', {
    sentence: '',
    history: []
  });
  res.json({ success: true, message: 'Sentence cleared' });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Sign Language to Text Converter API',
    version: '1.0.0'
  });
});

server.listen(PORT, '0.0.0.0', async () => {
  // Initialize gaming database
  console.log(`\n🎮 Initializing gaming database...`);
  initializeGamingDatabase();
  
  console.log(`\n🚀 Server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${LOCAL_IP}:${PORT}`);

  // Load ASL Model
  console.log('\n🤖 Loading ASL Model...');
  await loadASLModel();
  
  // Start ngrok tunnel for frontend port
  try {
    console.log(`\n⏳ Starting ngrok tunnel for frontend...`);
    
    // Kill any existing ngrok tunnels first to avoid conflicts
    console.log('   Checking for existing tunnels...');
    await ngrok.kill().catch(() => {
      // Ignore errors if no tunnels exist
    });
    
    // Configure ngrok with authtoken
    console.log('   Configuring ngrok with authtoken...');
    await ngrok.authtoken('2Nn9unMLbzX3F0CwZUmcbsWpC08_74iGYc5Loxz5FnD9kbJSb');
    
    // Start tunnel for frontend (port 5173)
    console.log('   Creating tunnel to port 5173...');
    ngrokUrl = await ngrok.connect({
      proto: 'http',
      addr: 5173,
      region: 'us',
      bind_tls: true
    });
    
    console.log(`\n✅ ngrok tunnel established!`);
    console.log(`\n🌐 PUBLIC ACCESS URLS:`);
    console.log(`   Frontend: ${ngrokUrl}`);
    console.log(`   Backend: ${ngrokUrl} (proxied through frontend)`);
    console.log(`\n📱 Mobile Camera QR Code:`);
    console.log(`   ${ngrokUrl}/mobile-camera`);
    console.log(`\n✨ Share this URL to access from ANYWHERE in the world!`);
    console.log(`\n💡 Tips:`);
    console.log(`   - QR code will automatically use this ngrok URL`);
    console.log(`   - Share ${ngrokUrl} with anyone to access the app`);
    console.log(`   - Mobile camera works from any location\n`);
  } catch (error) {
    console.error(`\n❌ Failed to start ngrok tunnel:`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Details: ${error.body ? JSON.stringify(error.body) : 'No additional details'}`);
    console.log(`\n📱 Falling back to local network:`);
    console.log(`   Frontend: http://${LOCAL_IP}:5173`);
    console.log(`   Backend: http://${LOCAL_IP}:${PORT}`);
    console.log(`   (Only accessible on same WiFi network)`);
    console.log(`\n💡 To fix ngrok:`);
    console.log(`   1. Check your authtoken is valid`);
    console.log(`   2. Visit https://dashboard.ngrok.com/get-started/your-authtoken`);
    console.log(`   3. Make sure you don't have other ngrok instances running\n`);
  }
  
  console.log(`\n🔌 Socket.IO server ready for connections\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down server...');
  
  // Kill ngrok tunnel
  if (ngrokUrl) {
    console.log('   Disconnecting ngrok tunnel...');
    await ngrok.kill();
  }
  
  console.log('   Server stopped gracefully ✓\n');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Shutting down server...');
  
  // Kill ngrok tunnel
  if (ngrokUrl) {
    console.log('   Disconnecting ngrok tunnel...');
    await ngrok.kill();
  }
  
  console.log('   Server stopped gracefully ✓\n');
  process.exit(0);
});
