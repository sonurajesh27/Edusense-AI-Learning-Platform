import React from 'react';

const QuickSigns = ({ onQuickSign }) => {
  const quickSigns = [
    { label: 'Hello', emoji: '👋' }, { label: 'Thanks', emoji: '🙏' }, { label: 'Help', emoji: '🆘' }, { label: 'Yes', emoji: '✅' },
    { label: 'No', emoji: '❌' }, { label: 'Please', emoji: '🙏' }, { label: 'Love', emoji: '❤️' }, { label: 'Good', emoji: '👍' }
  ];

  return (
    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
      <p className="text-white text-sm mb-3 font-medium flex items-center gap-2"><span>⚡</span> Quick Signs:</p>
      <div className="grid grid-cols-4 gap-2">
        {quickSigns.map((sign) => (
          <button key={sign.label} onClick={() => onQuickSign(sign.label)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg p-3 text-white text-xs font-medium transition-all hover:scale-105 active:scale-95">
            <div className="text-2xl mb-1">{sign.emoji}</div>
            {sign.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickSigns;
