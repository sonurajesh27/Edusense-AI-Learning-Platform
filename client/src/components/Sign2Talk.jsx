import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { allGestures } from '../utils/aslGestures';
import { checkAPIHealth, predictSignAPI, formatLandmarksForAPI } from '../utils/aslModelAPI';
import gestureDataCollector from '../utils/gestureDataCollector';
import {
  normalizeHandLandmarks,
  preprocessForPrediction,
  isValidHandPose
} from '../utils/handSignatureProcessor';
import Chat from './Chat';
import VirtualKeyboard from './VirtualKeyboard';
import CurrentMessage from './CurrentMessage';
import QuickSigns from './QuickSigns';
import GestureStatsViewer from './GestureStatsViewer';

const Sign2Talk = () => {
  const [messages, setMessages] = useState([{
    id: 1,
    sender: 'bot',
    text: 'Hello! I\'m your Sign2Talk AI assistant. Use the virtual keyboard or sign language to form sentences and chat with me! 🤖',
    timestamp: new Date(),
    animation: '🤖'
  }]);
  const [currentSign, setCurrentSign] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [lastDetectedSign, setLastDetectedSign] = useState('');
  const [detectionCount, setDetectionCount] = useState(0);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [useEnhancedModel, setUseEnhancedModel] = useState(false);

  const user = { name: 'User' }; // Placeholder user object
  
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const messagesEndRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const modelRef = useRef(null);
  const aslModelRef = useRef(null);
  const lastMessageTimeRef = useRef(0);
  const signStabilityRef = useRef({ sign: '', count: 0 });
  const gestureHistoryRef = useRef([]);
  const isDetectingRef = useRef(false);
  const noHandFramesRef = useRef(0);
  const backOfHandFramesRef = useRef(0);
  const lastGestureRef = useRef('');

  const GESTURE_STABILITY_THRESHOLD = 3; // Need 3 consistent detections for faster response
  const GESTURE_COOLDOWN = 800; // 800ms cooldown between detections
  const HAND_DOWN_THRESHOLD = 3; // Frames with no hand to trigger send
  const BACKSPACE_GESTURE_THRESHOLD = 3; // Back of hand frames to trigger backspace

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadModel = async () => {
      setIsModelLoading(true);
      try {
        await tf.ready();
        console.log('🔧 TensorFlow.js ready');
        
        // Load handpose model for hand detection
        const handposeModel = await handpose.load();
        modelRef.current = handposeModel;
        console.log('🤖 Handpose model loaded successfully');
        
        // Check if enhanced ASL model API is available
        const apiAvailable = await checkAPIHealth();
        setUseEnhancedModel(apiAvailable);
        
        if (apiAvailable) {
          console.log('✅ Enhanced ASL Model API available - Using 99% accuracy model');
          aslModelRef.current = 'API'; // Marker to use API
        } else {
          console.log('ℹ️ Using fallback gesture recognition');
          aslModelRef.current = null;
        }
        
        setIsModelLoading(false);
      } catch (error) {
        console.error('Error loading models:', error);
        setIsModelLoading(false);
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
    if (isCameraReady && !isModelLoading && isDetecting) {
      startDetection();
    } else {
      stopDetection();
    }
    return () => stopDetection();
  }, [isCameraReady, isModelLoading, isDetecting]);

  const startDetection = () => {
    if (detectionIntervalRef.current) return;
    detectionIntervalRef.current = setInterval(() => {
      detectHand();
    }, 150); // Faster detection for better responsiveness (150ms)
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
        
        // Reset no-hand counter when hand is detected
        noHandFramesRef.current = 0;

        // Check if showing back of hand (for backspace gesture)
        const isBackOfHand = detectBackOfHand(landmarks);
        
        if (isBackOfHand) {
          backOfHandFramesRef.current++;
          if (backOfHandFramesRef.current >= BACKSPACE_GESTURE_THRESHOLD) {
            handleBackspace();
            backOfHandFramesRef.current = 0;
            gestureHistoryRef.current = [];
            setCurrentSign('⌫ Backspace');
            setDetectionConfidence(10);
          }
          isDetectingRef.current = false;
          return;
        } else {
          backOfHandFramesRef.current = 0;
        }

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
        const gesture = await recognizeGesture(landmarks);
        if (gesture) {
          // Capture gesture data for learning (background process)
          gestureDataCollector.captureGesture({
            landmarks: landmarks,
            detectedSign: gesture.name,
            confidence: gesture.score / 10, // Normalize to 0-1
            recognitionMethod: 'gesture_estimator',
            timestamp: new Date().toISOString(),
            sessionContext: 'sign2talk_chat',
            videoConstraints: webcamRef.current?.video ? {
              width: webcamRef.current.video.videoWidth,
              height: webcamRef.current.video.videoHeight
            } : null
          });

          // Add to gesture history
          gestureHistoryRef.current.push(gesture.name);
          if (gestureHistoryRef.current.length > 10) {
            gestureHistoryRef.current.shift();
          }

          // Check if gesture is stable (same gesture for multiple frames)
          const recentGestures = gestureHistoryRef.current.slice(-GESTURE_STABILITY_THRESHOLD);
          const isStable = recentGestures.length === GESTURE_STABILITY_THRESHOLD &&
                          recentGestures.every(g => g === gesture.name);

          // Check cooldown period
          const now = Date.now();
          const canCapture = (now - lastMessageTimeRef.current) > GESTURE_COOLDOWN;

          if (isStable && canCapture) {
            handleGestureDetected(gesture.name, gesture.score);
            lastMessageTimeRef.current = now;
            gestureHistoryRef.current = [];
          }

          setCurrentSign(gesture.name);
          setDetectionConfidence(gesture.score);
        } else {
          // Capture failed recognition attempts too (for learning)
          gestureDataCollector.captureGesture({
            landmarks: landmarks,
            detectedSign: null,
            confidence: 0,
            recognitionMethod: 'gesture_estimator',
            timestamp: new Date().toISOString(),
            sessionContext: 'sign2talk_chat',
            recognitionFailed: true
          });

          setCurrentSign('');
          setDetectionConfidence(0);
        }
      } else {
        // No hand detected - just clear display
        noHandFramesRef.current++;
        setCurrentSign('');
        setDetectionConfidence(0);
        gestureHistoryRef.current = [];
        
        // Note: Auto-send disabled - user must click Send button manually
      }
    } catch (error) {
      console.error('Detection error:', error);
    } finally {
      isDetectingRef.current = false;
    }
  };

  // Detect if showing back of hand (palm facing away)
  const detectBackOfHand = (landmarks) => {
    // Calculate the z-axis orientation of the hand
    // If thumb is closer to camera than pinky, it's likely back of hand
    const thumbTip = landmarks[4];
    const pinkyTip = landmarks[20];
    const wrist = landmarks[0];
    const middleFinger = landmarks[12];
    
    // Check z-depth: back of hand has thumb further from camera (higher z)
    const thumbZ = thumbTip[2] || 0;
    const pinkyZ = pinkyTip[2] || 0;
    const middleZ = middleFinger[2] || 0;
    const wristZ = wrist[2] || 0;
    
    // Back of hand: fingertips are further away than wrist
    const avgFingerZ = (thumbZ + pinkyZ + middleZ) / 3;
    const zDifference = avgFingerZ - wristZ;
    
    // Also check hand orientation based on finger positioning
    const palmSpread = Math.abs(thumbTip[0] - pinkyTip[0]);
    
    // Back of hand: positive z difference and collapsed palm
    return zDifference > 10 && palmSpread < 150;
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

  const recognizeGesture = async (landmarks) => {
    // Try enhanced API model first if available (highest accuracy)
    if (useEnhancedModel && aslModelRef.current === 'API') {
      try {
        const normalizedLandmarks = preprocessForPrediction(landmarks);
        const formattedLandmarks = formatLandmarksForAPI(normalizedLandmarks);
        const result = await predictSignAPI(formattedLandmarks);

        // Lower threshold for better detection rate (0.65 instead of 0.75)
        if (result.confidence > 0.65) {
          console.log(`✅ Enhanced Model: ${result.letter} (${(result.confidence * 100).toFixed(1)}%)`);
          
          // Capture enhanced model data
          gestureDataCollector.captureGesture({
            landmarks: landmarks,
            detectedSign: result.letter.toLowerCase(),
            confidence: result.confidence,
            recognitionMethod: 'enhanced_api',
            timestamp: new Date().toISOString(),
            sessionContext: 'sign2talk_chat',
            modelAccuracy: 'enhanced_99_percent'
          });

          return {
            name: result.letter.toLowerCase(),
            score: result.confidence * 10
          };
        }
      } catch (apiError) {
        console.warn('API prediction failed, falling back to gesture estimator:', apiError);
        setUseEnhancedModel(false);
      }
    }

    // Fallback to gesture estimator with lower threshold for better detection
    const GE = new window.fp.GestureEstimator(allGestures);
    const gesture = await GE.estimate(landmarks, 6.5); // Lower from 8.0 to 6.5 for better sensitivity
    if (gesture.gestures.length > 0) {
      const sortedGestures = gesture.gestures.sort((a, b) => b.score - a.score);
      const bestGesture = sortedGestures[0];

      // Lower threshold for capturing more gestures (7.0 instead of 8.0)
      if (bestGesture.score > 7.0) {
        console.log(`✅ Gesture Estimator: ${bestGesture.name} (${bestGesture.score.toFixed(1)})`);
        return bestGesture;
      }
    }
    return null;
  };

  const handleGestureDetected = (sign, confidence) => {
    console.log(`🎯 Gesture Detected: ${sign} (confidence: ${confidence})`);
    setCurrentSign(sign);
    setDetectionConfidence(confidence);
    setLastDetectedSign(sign);
    setDetectionCount(prev => prev + 1);
    
    // Add to current message
    handleSignToMessage(sign);
  };

  const signAnimations = {
    'a': '🤟', 'b': '✌️', 'c': '👌', 'd': '👍', 'e': '✋', 'f': '👊', 'g': '🤞', 'h': '👋', 'i': '🤟', 'j': '🤟',
    'k': '🤘', 'l': '🤏', 'm': '🤌', 'n': '🤏', 'o': '⭕', 'p': '👆', 'q': '🤚', 'r': '🤞', 's': '✋', 't': '👆',
    'u': '🤟', 'v': '✌️', 'w': '🤞', 'x': '🤞', 'y': '👍', 'z': '🤟',
    'hello': '👋', 'thanks': '🙏', 'yes': '👍', 'no': '👎', 'please': '🙏', 'help': '🤝', 'love': '❤️', 'sorry': '😔', 'good': '😊', 'ok': '👌'
  };

  const botResponses = {
    'hello': ['Hi there! How can I help you today?', 'Hello! Nice to see you signing!', 'Hey! 👋 Great to chat with you!'],
    'thanks': ['You\'re welcome! 🙏', 'Happy to help!', 'Anytime! Keep practicing your signs!'],
    'help': ['I\'m here to assist you! What do you need?', 'How can I help you learn?', 'Need help with sign language? Just ask!'],
    'yes': ['Great! Let\'s continue!', 'Awesome! 👍', 'Perfect! Keep it up!'],
    'no': ['No problem! What else can I help with?', 'Okay, understood!', 'Alright! Let me know if you need anything.'],
    'please': ['Of course! 🙏', 'Sure thing!', 'Absolutely! Happy to help!'],
    'love': ['Sending love back! ❤️❤️', 'Love you too! 😍', 'That\'s so sweet! 😊'],
    'sorry': ['No worries! 😊', 'It\'s okay!', 'No problem at all!'],
    'good': ['That\'s wonderful! 😊', 'Excellent! Keep it up!', 'Great job! 👍'],
    'ok': ['Perfect! 👍', 'Alright then!', 'Sounds good!'],
    'default': ['I see you signed "{sign}"! Great job! 🤩', 'Nice! You signed "{sign}"!', 'Perfect {sign} sign! Keep practicing!']
  };

  const handleSignToMessage = (sign) => {
    console.log(`📝 Adding sign to message: "${sign}"`);
    // Only add to current message, don't send automatically
    setCurrentMessage(prev => {
      const newMessage = prev + sign.toUpperCase();
      console.log(`📝 Updated message: "${newMessage}"`);
      return newMessage;
    });
  };

  const quickSigns = [
    { label: 'Hello', emoji: '👋' }, { label: 'Thanks', emoji: '🙏' }, { label: 'Help', emoji: '🤝' }, { label: 'Yes', emoji: '👍' },
    { label: 'No', emoji: '👎' }, { label: 'Please', emoji: '🙏' }, { label: 'Love', emoji: '❤️' }, { label: 'Good', emoji: '😊' }
  ];

  const handleVirtualKeyPress = (char) => {
    // Add letter directly to message
    setCurrentMessage(prev => prev + char);
  };

  const handleSpacePress = () => {
    setCurrentMessage(prev => prev + ' ');
  };
  
  const handleBackspace = () => {
    setCurrentMessage(prev => prev.slice(0, -1));
  };

  const generateAIResponse = async (message) => {
    try {
      // Using Free GPT API (No API key required)
      const response = await fetch(
        "https://api.deepai.org/api/text-generator",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            text: `You are a helpful sign language assistant. Respond to this message in a friendly, supportive way: "${message}"`
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generatedText = data.output?.trim();
        if (generatedText && generatedText.length > 10) {
          // Clean up the response
          return generatedText.substring(0, 200);
        }
        throw new Error('Invalid response');
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      console.error('AI API Error:', error);
      // Fallback to local intelligent responses
      return getFallbackResponse(message);
    }
  };

  const getFallbackResponse = (message) => {
    const lowerMessage = message.toLowerCase().trim();
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage === 'good morning' || lowerMessage === 'good night') {
      const greetings = [
        'Hello! How can I help you today? 👋',
        'Hi there! I\'m here to assist with sign language. What would you like to talk about?',
        'Hey! Great to chat with you! Feel free to ask me anything about sign language.',
        'Welcome! I\'m your sign language AI assistant. How can I help?'
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // Thanks
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      const thanks = [
        'You\'re very welcome! Happy to help! 🙏',
        'My pleasure! Feel free to ask anything else!',
        'Anytime! Keep practicing your signs! 💪',
        'Glad I could help! What else would you like to know?'
      ];
      return thanks[Math.floor(Math.random() * thanks.length)];
    }
    
    // Help requests
    if (lowerMessage.includes('help') || lowerMessage.includes('assist') || lowerMessage.includes('support')) {
      return 'I\'m here to help! You can use the virtual keyboard to build sentences with sign words, or enable camera detection to recognize your hand signs. What would you like to do? 🤝';
    }
    
    // Questions about feelings
    if (lowerMessage.includes('how are you') || lowerMessage.includes('how r u')) {
      const feelings = [
        'I\'m doing great! Thanks for asking. How are you doing today? 😊',
        'I\'m excellent! Ready to help you with sign language. How about you?',
        'Doing wonderful! Excited to help you learn. What\'s on your mind?'
      ];
      return feelings[Math.floor(Math.random() * feelings.length)];
    }
    
    // Goodbyes
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you')) {
      const goodbyes = [
        'Goodbye! It was nice chatting with you. Come back soon! 👋',
        'See you later! Keep practicing your signs! 🌟',
        'Take care! Feel free to return anytime you need help with sign language! 💙'
      ];
      return goodbyes[Math.floor(Math.random() * goodbyes.length)];
    }
    
    // Questions
    if (lowerMessage.startsWith('what') || lowerMessage.startsWith('how') || lowerMessage.startsWith('why') || lowerMessage.startsWith('when') || lowerMessage.startsWith('where')) {
      const questionResponses = [
        `That's a great question! ${message.includes('sign') ? 'Sign language is a beautiful form of communication.' : 'Let me help you with that.'} What specific information are you looking for?`,
        `Interesting question! I'd be happy to explain. ${message.includes('learn') ? 'Learning sign language takes practice, but you\'re on the right track!' : 'Feel free to ask for more details.'}`,
        `Good question! The answer depends on what you're trying to achieve. Can you tell me more about your goal?`
      ];
      return questionResponses[Math.floor(Math.random() * questionResponses.length)];
    }
    
    // Emotions in message
    if (lowerMessage.includes('happy') || lowerMessage.includes('excited') || lowerMessage.includes('good')) {
      return 'That\'s wonderful! I\'m so glad to hear that! Keep up the positive energy! 😊✨';
    }
    
    if (lowerMessage.includes('sad') || lowerMessage.includes('tired') || lowerMessage.includes('difficult')) {
      return 'I understand it can be challenging sometimes. Don\'t worry, I\'m here to support you! You\'re doing great! 💪❤️';
    }
    
    // Learning related
    if (lowerMessage.includes('learn') || lowerMessage.includes('practice') || lowerMessage.includes('study')) {
      return 'Great! Learning sign language is an amazing journey! Use the virtual keyboard to practice forming sentences, and the camera detection to test your signs. Keep going! 📚✨';
    }
    
    // Food/Water mentions
    if (lowerMessage.includes('food') || lowerMessage.includes('water') || lowerMessage.includes('hungry') || lowerMessage.includes('thirsty')) {
      return 'Taking care of yourself is important! Make sure to stay hydrated and well-fed. Is there anything else I can help you with? 🍎💧';
    }
    
    // Default intelligent responses
    const words = message.split(' ');
    if (words.length > 5) {
      // Longer message
      return `Thank you for sharing that with me! It sounds like you're making progress with sign language. ${message.includes('I') ? 'Your experience is valuable!' : 'What would you like to explore next?'} 🌟`;
    } else if (words.length > 2) {
      // Medium message
      const genericResponses = [
        `I see! "${message}" - That's interesting. Would you like to tell me more about that?`,
        `Got it! Thanks for letting me know. How can I assist you further with sign language?`,
        `Understood! ${message.includes('need') || message.includes('want') ? 'Let me help you with that.' : 'What else would you like to discuss?'} 💬`,
        `That makes sense! Keep practicing with the keyboard and camera. You're doing great! 👍`
      ];
      return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    } else {
      // Short message
      const shortResponses = [
        `I received: "${message}". Can you tell me more about what you'd like to do?`,
        `"${message}" - Interesting! How can I help you with sign language today?`,
        `Thanks for your message! Would you like to practice signing or learn something new? 🎯`,
        `Got it! Let me know what you'd like to work on next. I'm here to help! 🤝`
      ];
      return shortResponses[Math.floor(Math.random() * shortResponses.length)];
    }
  };

  const handleSendMessage = async () => {
    if (currentMessage.trim()) {
      const userMessage = {
        id: Date.now(),
        sender: 'user',
        text: currentMessage.trim(),
        timestamp: new Date(),
        animation: '💬'
      };
      setMessages(prev => [...prev, userMessage]);
      const messageToSend = currentMessage.trim();
      setCurrentMessage('');
      setIsTyping(true);
      
      // Generate AI response using Hugging Face
      try {
        const botResponse = await generateAIResponse(messageToSend);
        
        const botMessage = {
          id: Date.now() + 1,
          sender: 'bot',
          text: botResponse,
          timestamp: new Date(),
          animation: '🤖'
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
        setDetectionCount(prev => prev + 1);
      } catch (error) {
        console.error('Error generating response:', error);
        setIsTyping(false);
      }
    }
  };

  const handleQuickSign = (sign) => {
    setCurrentMessage(prev => prev + (prev ? ' ' : '') + sign.toUpperCase());
  };

  const toggleDetection = () => {
    setIsDetecting(!isDetecting);
  };

  const clearChat = () => {
    setMessages([{
      id: 1,
      sender: 'bot',
      text: 'Chat cleared! Start signing again! 🤖',
      timestamp: new Date(),
      animation: '🤖'
    }]);
    setCurrentMessage('');
    setDetectionCount(0);
  };

  const clearCurrentMessage = () => setCurrentMessage('');

  // Alphabet keyboard with ASL sign emojis
  const alphabetKeyboard = [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
    ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'],
    ['U', 'V', 'W', 'X', 'Y', 'Z']
  ];

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl p-2 sm:p-3 border-b border-white/20 flex-shrink-0">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 rounded-lg">
              <span className="text-lg sm:text-xl">🤖</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white">Sign2Talk Chat</h1>
              <p className="text-white/60 text-[10px] sm:text-xs">AI-Powered Sign Language Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {useEnhancedModel && (
              <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded-full border border-purple-500/30">
                <span className="text-purple-300 text-[10px] sm:text-xs font-medium">⚡ Enhanced AI</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-[10px] sm:text-xs font-medium">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-br from-slate-900/30 to-indigo-900/30 backdrop-blur-lg overflow-hidden max-w-[1800px] mx-auto w-full">
        {/* Sidebar - Camera & Controls */}
        <div className="flex flex-col gap-2 w-full lg:w-80 xl:w-96 overflow-y-auto">
          {/* Camera Feed */}
          <div className="relative bg-black rounded-xl overflow-hidden border border-white/20 shadow-xl flex-shrink-0">
            {isModelLoading ? (
              <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-blue-900/30 to-purple-900/30">
                <div className="text-center p-3">
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4">
                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-white font-semibold text-sm sm:text-base mb-1">Loading AI...</p>
                  <p className="text-white/60 text-[10px] sm:text-xs">Initializing detection</p>
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
                
                {/* Hand Skeleton Canvas Overlay */}
                {isDetecting && (
                  <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border-2 border-gray-300">
                    <canvas
                      ref={canvasRef}
                      width={150}
                      height={150}
                      className="rounded-lg"
                    />
                  </div>
                )}

                {/* Detection Status */}
                <div className="absolute bottom-2 left-2 right-2">
                  {currentSign && (
                    <div className={`backdrop-blur-md rounded-lg p-2 border shadow-xl mb-2 ${
                      currentSign === '⌫ Backspace' 
                        ? 'bg-gradient-to-r from-red-500 to-orange-600 border-red-300/50' 
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-300/50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl animate-bounce">
                            {currentSign === '⌫ Backspace' ? '⌫' : (signAnimations[currentSign.toLowerCase()] || '🤷‍♂️')}
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{currentSign.toUpperCase()}</p>
                            <p className={`text-xs ${currentSign === '⌫ Backspace' ? 'text-red-100' : 'text-green-100'}`}>
                              {currentSign === '⌫ Backspace' ? 'Back of hand!' : 'Detected!'}
                            </p>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-white">{Math.round(detectionConfidence * 10)}%</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className={`px-3 py-1 rounded-full backdrop-blur-md font-semibold text-xs ${isDetecting ? 'bg-green-500/80 text-white' : 'bg-yellow-500/80 text-black'}`}>
                      {isDetecting ? '🔴 Live' : '⏸️ Paused'}
                    </div>
                    {useEnhancedModel && (
                      <div className="px-3 py-1 rounded-full backdrop-blur-md bg-purple-500/80 text-white font-semibold text-xs">
                        ⚡ Enhanced AI
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={toggleDetection} disabled={isModelLoading || !isCameraReady}
              className={`py-2 px-2 rounded-lg font-semibold text-xs transition-all ${isDetecting ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-green-500 hover:bg-green-600 text-white'} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1`}>
              {isDetecting ? '⏸️' : '▶️'} {isDetecting ? 'Pause' : 'Start'}
            </button>
            <button onClick={clearChat} className="bg-red-500 hover:bg-red-600 text-white py-2 px-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1">
              🗑️ Clear
            </button>
          </div>

          {/* Compact Virtual Keyboard */}
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl rounded-xl p-2 border border-purple-400/30 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-[10px] flex items-center gap-1">
                <span className="text-sm">👐</span> ASL Keyboard
              </h3>
              <button onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)} 
                className="text-white/60 hover:text-white text-[9px] px-1.5 py-0.5 bg-white/10 rounded hover:bg-white/20 transition-all">
                {showVirtualKeyboard ? '−' : '+'}
              </button>
            </div>
            
            {showVirtualKeyboard && (
              <div className="space-y-1.5">
                {/* Alphabet Keys */}
                {alphabetKeyboard.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-1 justify-center">
                    {row.map((letter) => (
                      <button 
                        key={letter} 
                        onClick={() => handleVirtualKeyPress(letter)}
                        className="bg-white/10 hover:bg-white/20 border border-white/30 rounded w-7 h-7 text-white font-bold transition-all hover:scale-110 active:scale-95 flex flex-col items-center justify-center shadow-lg text-[10px]"
                        title={`Sign for ${letter}`}>
                        <span className="text-[10px]">{signAnimations[letter.toLowerCase()] || '✋'}</span>
                      </button>
                    ))}
                  </div>
                ))}
                
                {/* Action Buttons */}
                <div className="flex gap-1 justify-center pt-1.5 border-t border-white/20">
                  <button onClick={handleSpacePress}
                    className="bg-blue-500/40 hover:bg-blue-500/60 border border-blue-400/50 rounded px-3 py-1 text-white font-semibold text-[9px] transition-all hover:scale-105 active:scale-95 shadow-lg">
                    SPC
                  </button>
                  <button onClick={handleBackspace}
                    className="bg-red-500/40 hover:bg-red-500/60 border border-red-400/50 rounded px-2 py-1 text-white font-semibold text-[9px] transition-all hover:scale-105 active:scale-95 flex items-center gap-0.5 shadow-lg">
                    ⌫
                  </button>
                  <button onClick={clearCurrentMessage}
                    className="bg-orange-500/40 hover:bg-orange-500/60 border border-orange-400/50 rounded px-2 py-1 text-white font-semibold text-[9px] transition-all hover:scale-105 active:scale-95 shadow-lg">
                    CLR
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Helper Tips */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg p-2 border border-blue-400/30">
            <p className="text-white text-xs font-medium mb-1">💡 Quick Tips</p>
            <div className="space-y-1 text-[10px] text-white/80">
              <div className="flex items-center gap-1">
                <span className="text-green-400">✓</span>
                <span>Show hand back to delete last letter</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400">✓</span>
                <span>Put hand down to auto-send message</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400">✓</span>
                <span>Hold sign steady for detection</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-lg p-2 border border-blue-400/30 text-center">
              <div className="text-base sm:text-lg font-bold text-blue-400">{detectionCount}</div>
              <p className="text-white/80 text-[9px]">Signs</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-xl rounded-lg p-2 border border-purple-400/30 text-center">
              <div className="text-base sm:text-lg font-bold text-purple-400">{messages.length}</div>
              <p className="text-white/80 text-[9px]">Messages</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-lg p-2 border border-green-400/30 text-center">
              <div className="text-base sm:text-lg font-bold text-green-400">{currentSign ? Math.round(detectionConfidence * 10) + '%' : '--'}</div>
              <p className="text-white/80 text-[9px]">Accuracy</p>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col gap-2 sm:gap-3 overflow-hidden min-w-0">
          {/* Chat Window */}
          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl rounded-xl border border-white/20 flex flex-col flex-1 shadow-xl">
            {/* Chat Header */}
            <div className="bg-white/10 backdrop-blur-md px-3 py-2 border-b border-white/20 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-base">🤖</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-xs sm:text-sm">AI Assistant</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-300 text-[10px]">Online</span>
                    </div>
                  </div>
                </div>
                <div className="text-white/60 text-[10px]">{messages.length} msgs</div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                  {message.sender !== 'user' && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 flex items-center justify-center mr-1.5 flex-shrink-0">
                      <span className="text-sm sm:text-base">{message.animation}</span>
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-xl p-2 sm:p-2.5 shadow-lg ${message.sender === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-white/10 backdrop-blur-md text-white border border-white/20'}`}>
                    <p className="text-xs sm:text-sm leading-relaxed break-words">{message.text}</p>
                    <div className="text-[9px] sm:text-[10px] opacity-60 mt-1 pt-1 border-t border-white/10">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {message.sender === 'user' && (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ml-1.5 flex-shrink-0">
                      <span className="text-white text-[10px] font-bold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/10 flex items-center justify-center mr-1.5">
                    <span className="text-sm sm:text-base">🤖</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-white/20">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-white/70 text-xs">Typing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Compose Area */}
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-2 sm:p-3 border border-white/20">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-white text-xs font-medium">📝 Compose</p>
              <div className="flex gap-1.5">
                <button onClick={handleBackspace} disabled={!currentMessage} className="text-white/60 hover:text-white disabled:opacity-30 text-[10px]" title="Delete last character">⌫</button>
                <button onClick={clearCurrentMessage} disabled={!currentMessage} className="text-white/60 hover:text-white disabled:opacity-30 text-[10px]">Clear</button>
              </div>
            </div>
            <div className="bg-black/30 rounded-lg p-2 sm:p-3 min-h-[60px] mb-2 border border-white/20 max-h-[100px] overflow-y-auto">
              <p className="text-white text-xs sm:text-sm leading-relaxed break-words">{currentMessage || <span className="text-white/40 text-[10px] sm:text-xs">Build your message...</span>}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSendMessage} disabled={!currentMessage}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold text-xs transition-all">
                📤 Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gesture Learning Stats (hidden by default, enable for development) */}
      <GestureStatsViewer isVisible={false} />

      {/* Footer */}
      <div className="bg-gradient-to-r from-slate-900/90 to-indigo-900/90 backdrop-blur-xl p-2 border-t border-white/20 flex-shrink-0">
        <div className="flex items-center justify-center gap-3 sm:gap-6 text-white/60 text-[10px] max-w-[1800px] mx-auto">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            <span>🤖 AI Powered</span>
          </div>
          <div className="hidden sm:block">•</div>
          <div className="hidden sm:flex items-center gap-1">
            <span>👐 Hand Detection</span>
          </div>
          <div className="hidden sm:block">•</div>
          <div className="hidden sm:flex items-center gap-1">
            <span>💬 Real-time Chat</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sign2Talk;
