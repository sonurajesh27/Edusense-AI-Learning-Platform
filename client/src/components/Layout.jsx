import React, { useState } from 'react';

const Layout = ({ children, user, onLogout, currentMode, onModeChange }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    {
      id: 'signLanguage',
      name: 'Sign to Text',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
      badge: 'AI'
    },
    {
      id: 'sign2talk',
      name: 'Sign2Talk',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      badge: 'Chat'
    },
    {
      id: 'touchRead',
      name: 'TouchRead',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      badge: 'OCR'
    },
    {
      id: 'textToSign',
      name: 'Text to Sign',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      ),
      badge: 'New'
    },
    {
      id: 'gamified',
      name: 'Learning Games',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      ),
      badge: '🎮'
    },
    {
      id: 'analytics',
      name: 'Progress Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      badge: '📊'
    }
  ];

  // Add dashboard only for admin users
  if (user?.role === 'admin' || user?.role === 'caregiver') {
    menuItems.push({
      id: 'dashboard',
      name: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badge: '👑'
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Top Header Bar */}
      <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Menu Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hidden lg:block p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-white">EduSense</h1>
                  <p className="text-xs text-white/60">AI-Powered Learning Platform</p>
                </div>
              </div>
            </div>

            {/* Right: User Info and Actions */}
            <div className="flex items-center gap-4">
              {/* Status Indicator */}
              <div className="hidden md:flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-xs font-medium">Online</span>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-3 bg-white/10 rounded-full px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-white text-sm font-medium">{user?.name || 'User'}</p>
                  <p className="text-white/60 text-xs capitalize">{user?.role || 'Student'}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title="Logout"
                >
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden lg:block fixed left-0 top-[73px] h-[calc(100vh-73px)] bg-black/20 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ${
            isSidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onModeChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  currentMode === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                    : 'bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                <span className={currentMode === item.id ? 'text-white' : 'text-white/60'}>
                  {item.icon}
                </span>
                {isSidebarOpen && (
                  <>
                    <span className="flex-1 text-left font-medium text-sm">{item.name}</span>
                    {item.badge && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            <aside className="lg:hidden fixed left-0 top-[73px] h-[calc(100vh-73px)] w-64 bg-black/90 backdrop-blur-xl border-r border-white/10 z-50">
              <nav className="p-4 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onModeChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      currentMode === item.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white/5 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span className={currentMode === item.id ? 'text-white' : 'text-white/60'}>
                      {item.icon}
                    </span>
                    <span className="flex-1 text-left font-medium text-sm">{item.name}</span>
                    {item.badge && (
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
          }`}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
