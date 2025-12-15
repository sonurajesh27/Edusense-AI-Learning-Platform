const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');
const { exec } = require('child_process');
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

// Store recognized signs and sentences
let currentSentence = '';
let recognitionHistory = [];

// Store mobile camera connections
let mobileConnections = new Map();

// Store Sign2Talk users
let sign2TalkUsers = new Map();

// Store Cloudflare Tunnel URL
let cloudflareUrl = null;
let cloudflaredProcess = null;

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
  console.log(`\n🚀 Server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://${LOCAL_IP}:${PORT}`);
  
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
