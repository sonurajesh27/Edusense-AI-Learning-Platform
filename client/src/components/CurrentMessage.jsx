import React from 'react';

const CurrentMessage = ({ currentMessage, onSend, onDeleteLast, onClear }) => {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white text-sm font-medium">📝 Current Message:</p>
        <div className="flex gap-2">
          <button onClick={onDeleteLast} disabled={!currentMessage} className="text-white/60 hover:text-white disabled:opacity-30 text-xs">⌫ Delete</button>
          <button onClick={onClear} disabled={!currentMessage} className="text-white/60 hover:text-white disabled:opacity-30 text-xs">🗑️ Clear</button>
        </div>
      </div>
      <div className="bg-black/30 rounded-lg p-3 min-h-[60px] mb-3 border border-white/20">
        <p className="text-white text-lg font-mono">{currentMessage || <span className="text-white/40 text-sm">Signs will appear here...</span>}</p>
      </div>
      <button onClick={onSend} disabled={!currentMessage}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all">
        📤 Send Message
      </button>
    </div>
  );
};

export default CurrentMessage;
