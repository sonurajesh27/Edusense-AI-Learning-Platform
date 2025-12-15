import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { allGestures } from '../utils/aslGestures';
import CameraView from './CameraView';
import ControlPanel from './ControlPanel';
import Stats from './Stats';
import Chat from './Chat';
import VirtualKeyboard from './VirtualKeyboard';
import CurrentMessage from './CurrentMessage';
import QuickSigns from './QuickSigns';

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
  
  const user = { name: 'User' }; // Placeholder user object
  
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const messagesEndRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const modelRef = useRef(null);
  const lastMessageTimeRef = useRef(0);
  const signStabilityRef = useRef({ sign: '', count: 0 });

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
        const model = await handpose.load();
        modelRef.current = model;
        setIsModelLoading(false);
        console.log('🤖 Handpose model loaded');
      } catch (error) {
        console.error('Error loading model:', error);
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
    }, 400); // Balanced interval for accurate detection without being too slow
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  const detectHand = async () => {
    if (!webcamRef.current || !webcamRef.current.video || webcamRef.current.video.readyState !== 4 || !modelRef.current) {
      return;
    }
    const video = webcamRef.current.video;
    const predictions = await modelRef.current.estimateHands(video);

    if (predictions.length > 0) {
      const hand = predictions[0];
      const gesture = await recognizeGesture(hand.landmarks);
      if (gesture) {
        handleGestureDetected(gesture.name, gesture.score);
      } else {
        setCurrentSign('');
        setDetectionConfidence(0);
      }
    } else {
      setCurrentSign('');
      setDetectionConfidence(0);
    }
  };

  const recognizeGesture = async (landmarks) => {
    const GE = new window.fp.GestureEstimator(allGestures);
    const gesture = await GE.estimate(landmarks, 9.0); // Increased for better accuracy
    if (gesture.gestures.length > 0) {
      // Sort by score to get best matches
      const sortedGestures = gesture.gestures.sort((a, b) => b.score - a.score);
      const bestGesture = sortedGestures[0];
      
      // Only accept if confidence is high enough and significantly better than second best
      if (bestGesture.score > 9.0) {
        // If there's a second gesture, ensure the best one is clearly better
        if (sortedGestures.length > 1) {
          const secondBest = sortedGestures[1];
          const scoreDiff = bestGesture.score - secondBest.score;
          // Require at least 1.5 point difference to avoid confusion
          if (scoreDiff > 1.5) {
            return bestGesture;
          }
        } else {
          // Only one gesture detected with high confidence
          return bestGesture;
        }
      }
    }
    return null;
  };

  const handleGestureDetected = (sign, confidence) => {
    setCurrentSign(sign);
    setDetectionConfidence(confidence);
    if (signStabilityRef.current.sign === sign) {
      signStabilityRef.current.count++;
    } else {
      signStabilityRef.current = { sign, count: 1 };
    }
    const now = Date.now();
    // Increased stability count to 7 for better accuracy and prevent wrong detections
    if (signStabilityRef.current.count >= 7 && sign !== lastDetectedSign && now - lastMessageTimeRef.current > 4000) {
      handleSignToMessage(sign);
      setLastDetectedSign(sign);
      lastMessageTimeRef.current = now;
      setDetectionCount(prev => prev + 1);
      signStabilityRef.current = { sign: '', count: 0 };
    }
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
    // Only add to current message, don't send automatically
    setCurrentMessage(prev => prev + sign.toUpperCase());
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
          <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-[10px] sm:text-xs font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-2 sm:gap-3 p-2 sm:p-3 bg-gradient-to-br from-slate-900/30 to-indigo-900/30 backdrop-blur-lg overflow-hidden max-w-[1800px] mx-auto w-full">
        {/* Sidebar - Camera & Controls */}
        <div className="flex flex-col gap-2 sm:gap-3 w-full lg:w-80 xl:w-96 overflow-y-auto">
          {/* Camera Feed */}
          <div className="relative bg-black rounded-xl overflow-hidden border border-white/20 shadow-xl">
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
              <>
                <Webcam ref={webcamRef} onUserMedia={() => setIsCameraReady(true)} screenshotFormat="image/jpeg" className="w-full aspect-video" mirrored={true} />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
                {currentSign && (
                  <div className="absolute top-2 left-2 right-2 animate-fade-in">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 backdrop-blur-md rounded-lg p-2 sm:p-3 border border-green-300/50 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl sm:text-3xl animate-bounce">{signAnimations[currentSign.toLowerCase()] || '🤷‍♂️'}</div>
                          <div>
                            <p className="text-white font-bold text-sm sm:text-base">{currentSign.toUpperCase()}</p>
                            <p className="text-green-100 text-[10px] sm:text-xs">
                              {signStabilityRef.current.sign === currentSign 
                                ? `Hold steady... ${signStabilityRef.current.count}/7` 
                                : 'Detected!'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg sm:text-xl font-bold text-white">{Math.round(detectionConfidence * 10)}%</div>
                          {signStabilityRef.current.sign === currentSign && (
                            <div className="w-full bg-white/30 rounded-full h-1 mt-1">
                              <div 
                                className="bg-white h-1 rounded-full transition-all duration-300"
                                style={{ width: `${(signStabilityRef.current.count / 7) * 100}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 right-2">
                  <div className={`px-2 sm:px-3 py-1 rounded-full backdrop-blur-md font-semibold text-[10px] sm:text-xs ${isDetecting ? 'bg-green-500/80 text-white' : 'bg-yellow-500/80 text-black'}`}>
                    {isDetecting ? '🔴 Live' : '⏸️ Paused'}
                  </div>
                </div>
              </>
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

          {/* Quick Words */}
          <div className="bg-white/10 rounded-lg p-2 sm:p-3 border border-white/20">
            <p className="text-white text-xs mb-2 font-medium">⭐ Quick Words</p>
            <div className="grid grid-cols-4 gap-1.5">
              {quickSigns.map((sign) => (
                <button key={sign.label} onClick={() => handleQuickSign(sign.label)}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-md p-1.5 text-white text-xs font-medium transition-all hover:scale-105 active:scale-95">
                  <div className="text-lg mb-0.5">{sign.emoji}</div>
                  <span className="text-[9px]">{sign.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl rounded-lg p-2 border border-blue-400/30 text-center">
              <div className="text-base sm:text-lg font-bold text-blue-400">{detectionCount}</div>
              <p className="text-white/80 text-[9px]">Sent</p>
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
              <button onClick={() => setShowVirtualKeyboard(!showVirtualKeyboard)}
                className="bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 py-2 px-3 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1">
                ⌨️ <span className="hidden sm:inline">Keys</span>
              </button>
              <button onClick={handleSendMessage} disabled={!currentMessage}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold text-xs transition-all">
                📤 Send
              </button>
            </div>
          </div>

          {/* Virtual Keyboard - Alphabet Only */}
          {showVirtualKeyboard && (
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl rounded-xl p-3 border border-purple-400/30 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <span className="text-lg">👐</span> ASL Alphabet Keyboard
                </h3>
                <button onClick={() => setShowVirtualKeyboard(false)} 
                  className="text-white/60 hover:text-white text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-all">
                  ✕ Hide
                </button>
              </div>
              
              <div className="space-y-2">
                {/* Alphabet Keys */}
                {alphabetKeyboard.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-2 justify-center">
                    {row.map((letter) => (
                      <button 
                        key={letter} 
                        onClick={() => handleVirtualKeyPress(letter)}
                        className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg w-10 h-10 sm:w-12 sm:h-12 text-white font-bold transition-all hover:scale-110 active:scale-95 flex flex-col items-center justify-center shadow-lg"
                        title={`Sign for ${letter}`}>
                        <span className="text-sm sm:text-base">{signAnimations[letter.toLowerCase()] || '✋'}</span>
                        <span className="text-[9px] sm:text-[10px] mt-0.5">{letter}</span>
                      </button>
                    ))}
                  </div>
                ))}
                
                {/* Action Buttons */}
                <div className="flex gap-2 justify-center pt-3 border-t border-white/20">
                  <button onClick={handleSpacePress}
                    className="bg-blue-500/40 hover:bg-blue-500/60 border border-blue-400/50 rounded-lg px-6 py-2 text-white font-semibold text-xs transition-all hover:scale-105 active:scale-95 shadow-lg">
                    SPACE
                  </button>
                  <button onClick={handleBackspace}
                    className="bg-red-500/40 hover:bg-red-500/60 border border-red-400/50 rounded-lg px-4 py-2 text-white font-semibold text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1 shadow-lg">
                    <span className="text-base">⌫</span> Backspace
                  </button>
                  <button onClick={clearCurrentMessage}
                    className="bg-orange-500/40 hover:bg-orange-500/60 border border-orange-400/50 rounded-lg px-4 py-2 text-white font-semibold text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1 shadow-lg">
                    <span className="text-base">🗑️</span> Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-slate-900/90 to-indigo-900/90 backdrop-blur-xl p-2 border-t border-white/20 flex-shrink-0">
        <div className="flex items-center justify-center gap-3 sm:gap-6 text-white/60 text-[10px] max-w-[1800px] mx-auto">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            <span>🤖 AI Powered</span>
          </div>
          <div className="hidden sm:block">•</div>
          <div className="hidden sm:flex items-center gap-1">
            <span>👐 Sign Detection</span>
          </div>
          <div className="hidden sm:block">•</div>
          <div className="hidden sm:flex items-center gap-1">
            <span>⌨️ Virtual Keyboard</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sign2Talk;
