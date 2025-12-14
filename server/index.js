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
  });
});

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sign Language Converter API is running' });
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
