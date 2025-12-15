import React, { useState, useEffect } from 'react';

const GamifiedLearning = () => {
  const [userProgress, setUserProgress] = useState({
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    streak: 7,
    totalSigns: 156,
    badges: ['🥇', '🎯', '🔥', '⭐'],
    achievements: []
  });

  const [selectedGame, setSelectedGame] = useState(null);
  const [gameState, setGameState] = useState({
    score: 0,
    currentRound: 0,
    totalRounds: 5,
    timeLeft: 30,
    isPlaying: false
  });

  const games = [
    {
      id: 'sign-match',
      title: 'Sign Match',
      description: 'Match the sign with the correct letter',
      icon: '🎯',
      difficulty: 'Easy',
      xpReward: 50,
      color: 'blue'
    },
    {
      id: 'speed-sign',
      title: 'Speed Sign',
      description: 'Sign as many letters as possible in 60 seconds',
      icon: '⚡',
      difficulty: 'Medium',
      xpReward: 100,
      color: 'yellow'
    },
    {
      id: 'sign-quiz',
      title: 'Sign Quiz',
      description: 'Answer questions about sign language',
      icon: '📝',
      difficulty: 'Medium',
      xpReward: 75,
      color: 'purple'
    },
    {
      id: 'word-builder',
      title: 'Word Builder',
      description: 'Sign complete words letter by letter',
      icon: '🏗️',
      difficulty: 'Hard',
      xpReward: 150,
      color: 'green'
    },
    {
      id: 'memory-signs',
      title: 'Memory Signs',
      description: 'Remember and repeat sign sequences',
      icon: '🧠',
      difficulty: 'Hard',
      xpReward: 200,
      color: 'pink'
    },
    {
      id: 'daily-challenge',
      title: 'Daily Challenge',
      description: 'Complete today\'s special challenge',
      icon: '🎁',
      difficulty: 'Variable',
      xpReward: 300,
      color: 'red'
    }
  ];

  const achievements = [
    { id: 1, title: 'First Steps', description: 'Complete first lesson', icon: '🏆', unlocked: true },
    { id: 2, title: 'Week Warrior', description: '7-day streak', icon: '🔥', unlocked: true },
    { id: 3, title: 'Century Club', description: '100 signs learned', icon: '💯', unlocked: true },
    { id: 4, title: 'Speed Demon', description: 'Complete Speed Sign in under 30s', icon: '⚡', unlocked: false },
    { id: 5, title: 'Perfect Score', description: 'Get 100% in a quiz', icon: '🌟', unlocked: false },
    { id: 6, title: 'Master Signer', description: 'Reach level 10', icon: '👑', unlocked: false },
  ];

  const leaderboard = [
    { rank: 1, name: 'You', score: 2450, avatar: '👤', isUser: true },
    { rank: 2, name: 'Alex', score: 2300, avatar: '🧑' },
    { rank: 3, name: 'Maria', score: 2100, avatar: '👩' },
    { rank: 4, name: 'John', score: 1950, avatar: '👨' },
    { rank: 5, name: 'Sarah', score: 1800, avatar: '👧' },
  ];

  useEffect(() => {
    let timer;
    if (gameState.isPlaying && gameState.timeLeft > 0) {
      timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (gameState.timeLeft === 0 && gameState.isPlaying) {
      endGame();
    }
    return () => clearTimeout(timer);
  }, [gameState.isPlaying, gameState.timeLeft]);

  const startGame = (game) => {
    setSelectedGame(game);
    setGameState({
      score: 0,
      currentRound: 1,
      totalRounds: 5,
      timeLeft: 30,
      isPlaying: true
    });
  };

  const endGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
    const xpGained = Math.floor(gameState.score * 1.5);
    setUserProgress(prev => ({
      ...prev,
      xp: prev.xp + xpGained,
      totalSigns: prev.totalSigns + gameState.score
    }));
  };

  const closeGame = () => {
    setSelectedGame(null);
    setGameState({
      score: 0,
      currentRound: 0,
      totalRounds: 5,
      timeLeft: 30,
      isPlaying: false
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-blue-400';
    }
  };

  const getGameColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      yellow: 'from-yellow-500 to-yellow-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      pink: 'from-pink-500 to-pink-600',
      red: 'from-red-500 to-red-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-6xl">
        {!selectedGame ? (
          <>
            {/* Header & Progress */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">🎮 Gamified Learning</h1>
                  <p className="text-white/70">Level {userProgress.level} • {userProgress.totalSigns} Signs Mastered</p>
                </div>
                <div className="text-right">
                  <div className="flex gap-2 text-2xl mb-2">
                    {userProgress.badges.map((badge, idx) => (
                      <span key={idx} className="transform hover:scale-125 transition-transform cursor-pointer">
                        {badge}
                      </span>
                    ))}
                  </div>
                  <p className="text-white/70 text-sm">
                    <span className="text-orange-400 font-bold">{userProgress.streak}</span> day streak 🔥
                  </p>
                </div>
              </div>

              {/* XP Bar */}
              <div className="bg-white/10 rounded-full h-8 overflow-hidden border border-white/20">
                <div className="flex items-center h-full px-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(userProgress.xp / userProgress.xpToNextLevel) * 100}%` }}
                  ></div>
                  <span className="text-white text-sm font-bold ml-auto">
                    {userProgress.xp} / {userProgress.xpToNextLevel} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Games Grid */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">🎯 Available Games</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                    onClick={() => startGame(game)}
                  >
                    <div className="text-5xl mb-3 text-center">{game.icon}</div>
                    <h3 className="text-xl font-bold text-white mb-2 text-center">{game.title}</h3>
                    <p className="text-white/70 text-sm mb-4 text-center">{game.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-semibold ${getDifficultyColor(game.difficulty)}`}>
                        {game.difficulty}
                      </span>
                      <span className="text-yellow-400 font-bold">+{game.xpReward} XP</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard & Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leaderboard */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-3xl mr-2">🏆</span>
                  Leaderboard
                </h2>
                <div className="space-y-3">
                  {leaderboard.map((user) => (
                    <div
                      key={user.rank}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        user.isUser ? 'bg-blue-500/30 border-2 border-blue-500' : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-2xl font-bold ${
                          user.rank === 1 ? 'text-yellow-400' :
                          user.rank === 2 ? 'text-gray-300' :
                          user.rank === 3 ? 'text-orange-400' :
                          'text-white/50'
                        }`}>
                          #{user.rank}
                        </span>
                        <span className="text-3xl">{user.avatar}</span>
                        <span className="text-white font-semibold">{user.name}</span>
                      </div>
                      <span className="text-yellow-400 font-bold">{user.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <span className="text-3xl mr-2">🎖️</span>
                  Achievements
                </h2>
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-4 p-3 rounded-lg ${
                        achievement.unlocked ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 opacity-50'
                      }`}
                    >
                      <span className="text-4xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{achievement.title}</h3>
                        <p className="text-white/70 text-sm">{achievement.description}</p>
                      </div>
                      {achievement.unlocked && (
                        <span className="text-green-400 text-2xl">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Game Playing Screen */
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-6xl">{selectedGame.icon}</span>
                <div>
                  <h2 className="text-3xl font-bold text-white">{selectedGame.title}</h2>
                  <p className="text-white/70">{selectedGame.description}</p>
                </div>
              </div>
              <button
                onClick={closeGame}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Game Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{gameState.score}</div>
                <p className="text-white/70 text-sm">Score</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{gameState.currentRound}/{gameState.totalRounds}</div>
                <p className="text-white/70 text-sm">Round</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className={`text-3xl font-bold ${gameState.timeLeft < 10 ? 'text-red-400' : 'text-green-400'}`}>
                  {gameState.timeLeft}s
                </div>
                <p className="text-white/70 text-sm">Time Left</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">+{selectedGame.xpReward}</div>
                <p className="text-white/70 text-sm">XP Reward</p>
              </div>
            </div>

            {/* Game Area */}
            <div className="bg-white/5 rounded-xl p-12 text-center min-h-[400px] flex items-center justify-center">
              <div>
                <div className="text-8xl mb-6">🎮</div>
                <h3 className="text-2xl font-bold text-white mb-4">Game in Progress</h3>
                <p className="text-white/70 mb-6">Show your hand signs to play!</p>
                
                {gameState.isPlaying ? (
                  <button
                    onClick={endGame}
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    End Game
                  </button>
                ) : (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6">
                    <h4 className="text-xl font-bold text-white mb-2">Game Over!</h4>
                    <p className="text-green-300 text-lg mb-4">
                      Score: {gameState.score} • XP Gained: {Math.floor(gameState.score * 1.5)}
                    </p>
                    <button
                      onClick={closeGame}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Back to Games
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamifiedLearning;
