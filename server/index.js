const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Store recognized signs and sentences
let currentSentence = '';
let recognitionHistory = [];

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

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});
