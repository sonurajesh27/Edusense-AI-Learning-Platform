import React from 'react';

const VirtualKeyboard = ({ onKeyPress, showKeyboard, setShowKeyboard }) => {
  const virtualKeyboardLetters = [
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
    ['J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'],
    ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
  ];

  if (!showKeyboard) {
    return (
      <button onClick={() => setShowKeyboard(true)}
        className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-300 py-2 rounded-lg text-sm transition-all">
        ⌨️ Show Virtual Keyboard
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl rounded-2xl p-4 border-2 border-purple-400/30 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-bold flex items-center gap-2">⌨️ Virtual Sign Keyboard</h3>
        <button onClick={() => setShowKeyboard(false)} className="text-white/60 hover:text-white text-xs">Hide</button>
      </div>
      <div className="space-y-2">
        {virtualKeyboardLetters.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 justify-center">
            {row.map((letter) => (
              <button key={letter} onClick={() => onKeyPress(letter)}
                className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg w-10 h-10 text-white font-bold text-sm transition-all hover:scale-110 active:scale-95 flex items-center justify-center">
                {letter}
              </button>
            ))}
          </div>
        ))}
        <div className="flex gap-2 justify-center mt-3">
          <button onClick={() => onKeyPress(' ')}
            className="bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg px-8 h-10 text-white font-medium text-sm transition-all hover:scale-105 active:scale-95">
            Space
          </button>
        </div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
