import React from 'react';

const Header = () => {
  return (
    <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-gradient-to-br from-primary-400 to-primary-600 p-3 rounded-xl shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Sign Language Converter</h1>
            <p className="text-white/70 text-sm mt-1">Real-time sign language to text translation powered by AI</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center space-x-2 bg-green-500/20 px-4 py-2 rounded-full border border-green-500/30">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-300 text-sm font-medium">AI Ready</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
