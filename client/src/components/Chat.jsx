import React from 'react';

const Chat = ({ messages, isTyping, user }) => {
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl border-2 border-white/20 flex flex-col h-[400px] shadow-2xl">
      <div className="bg-white/10 backdrop-blur-md px-4 py-3 border-b border-white/20 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Sign2Talk AI Bot</h3>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-xs">Always Online</span>
              </div>
            </div>
          </div>
          <div className="text-white/60 text-xs">{messages.length} msgs</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {message.sender !== 'user' && (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-2 flex-shrink-0">
                <span className="text-lg">{message.animation}</span>
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl p-3 shadow-lg ${message.sender === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-white/10 backdrop-blur-md text-white border border-white/20'}`}>
              {message.sender === 'user' && message.animation && message.animation !== '🤖' && (
                <div className="text-3xl mb-2 text-center">{message.animation}</div>
              )}
              <p className="text-sm leading-relaxed">{message.text}</p>
              <div className="text-xs opacity-60 mt-2 pt-2 border-t border-white/10">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {message.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ml-2 flex-shrink-0">
                <span className="text-white text-xs font-bold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mr-2">
              <span className="text-lg">🤖</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-white/70 text-sm">Typing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default Chat;
