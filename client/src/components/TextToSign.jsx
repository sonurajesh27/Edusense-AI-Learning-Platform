import React, { useState } from 'react';

const TextToSign = () => {
  const [inputText, setInputText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const aslSigns = {
    'A': '✊', 'B': '🖐', 'C': '👌', 'D': '☝️', 'E': '✌️',
    'F': '👌', 'G': '👍', 'H': '✌️', 'I': '🤙', 'J': '🤙',
    'K': '✌️', 'L': '👆', 'M': '✊', 'N': '✊', 'O': '👌',
    'P': '☝️', 'Q': '👇', 'R': '✌️', 'S': '✊', 'T': '👊',
    'U': '✌️', 'V': '✌️', 'W': '🤟', 'X': '☝️', 'Y': '🤙', 'Z': '☝️',
    ' ': '👋'
  };

  const playAnimation = () => {
    if (!inputText) return;
    
    setIsPlaying(true);
    setCurrentIndex(0);
    
    const chars = inputText.toUpperCase().split('');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index >= chars.length) {
        clearInterval(interval);
        setIsPlaying(false);
        setCurrentIndex(0);
        return;
      }
      
      setCurrentIndex(index);
      index++;
    }, 1000 / speed);
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const textToSpeech = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(inputText);
      utterance.rate = speed;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in your browser.');
    }
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const getCurrentChar = () => {
    if (!inputText || currentIndex >= inputText.length) return '';
    return inputText[currentIndex].toUpperCase();
  };

  const getCurrentSign = () => {
    const char = getCurrentChar();
    return aslSigns[char] || '🤟';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">✍️ Text-to-Sign Converter</h1>
          <p className="text-white/70">Convert text to animated sign language</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">📝 Enter Text</h2>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-48 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-blue-500 resize-none mb-4"
              maxLength={100}
            />
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/70 text-sm">
                {inputText.length} / 100 characters
              </span>
              <button
                onClick={() => setInputText('')}
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                Clear
              </button>
            </div>

            {/* Speed Control */}
            <div className="mb-4">
              <label className="block text-white text-sm font-medium mb-2">
                Animation Speed: {speed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.5"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-white/50 text-xs mt-1">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {!isPlaying ? (
                <button
                  onClick={playAnimation}
                  disabled={!inputText}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Play Signs
                </button>
              ) : (
                <button
                  onClick={stopAnimation}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Stop
                </button>
              )}

              {!isSpeaking ? (
                <button
                  onClick={textToSpeech}
                  disabled={!inputText}
                  className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  Speak
                </button>
              ) : (
                <button
                  onClick={stopSpeech}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                  Stop Speech
                </button>
              )}
            </div>
          </div>

          {/* Animation Display */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">🤟 Sign Animation</h2>
            
            <div className="bg-white/5 rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center">
              {isPlaying ? (
                <>
                  <div className="text-9xl mb-6 animate-bounce">
                    {getCurrentSign()}
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">
                    {getCurrentChar()}
                  </div>
                  <div className="text-white/70">
                    Letter {currentIndex + 1} of {inputText.length}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full max-w-md mt-6">
                    <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / inputText.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-9xl mb-6">🤟</div>
                  <p className="text-white/70 text-center">
                    {inputText ? 'Click "Play Signs" to start animation' : 'Enter text to begin'}
                  </p>
                </>
              )}
            </div>

            {/* Sign Sequence Preview */}
            {inputText && (
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-3">Sign Sequence:</h3>
                <div className="flex flex-wrap gap-2">
                  {inputText.toUpperCase().split('').map((char, idx) => (
                    <div
                      key={idx}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2 transition-all ${
                        idx === currentIndex && isPlaying
                          ? 'bg-blue-500 border-blue-400 scale-125'
                          : 'bg-white/10 border-white/20'
                      }`}
                    >
                      {aslSigns[char] || '🤟'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Examples */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">💡 Quick Examples</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Hello', 'Thanks', 'Help', 'Love'].map((example) => (
              <button
                key={example}
                onClick={() => setInputText(example)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-3 text-white font-medium transition-all hover:scale-105"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mt-6">
          <p className="text-blue-200 text-sm">
            <strong>Note:</strong> This converter uses simplified ASL finger-spelling. Each letter is represented by a hand sign emoji. For complete ASL learning, please refer to proper educational resources.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TextToSign;
