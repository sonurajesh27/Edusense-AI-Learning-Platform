import React, { useState, useEffect } from 'react';

const ProgressAnalytics = ({ userId }) => {
  const [timeRange, setTimeRange] = useState('week'); // week, month, year
  const [progressData, setProgressData] = useState({
    signLanguage: {
      totalSigns: 156,
      accuracy: 87,
      sessionsCompleted: 45,
      timeSpent: '12h 34m',
      improvement: '+15%',
      recentSigns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    },
    touchRead: {
      booksRead: 8,
      wordsRead: 1240,
      readingAccuracy: 92,
      timeSpent: '8h 15m',
      improvement: '+22%',
      avgReadingSpeed: '45 wpm'
    },
    sign2Talk: {
      conversations: 23,
      messagesExchanged: 189,
      responseTime: '2.3s',
      timeSpent: '5h 42m',
      improvement: '+8%'
    },
    gamifiedLearning: {
      gamesPlayed: 67,
      totalXP: 4850,
      level: 12,
      badges: 15,
      improvement: '+25%',
      favoriteGame: 'Speed Sign'
    }
  });

  const [weeklyActivity, setWeeklyActivity] = useState([
    { day: 'Mon', minutes: 45, sessions: 3 },
    { day: 'Tue', minutes: 62, sessions: 4 },
    { day: 'Wed', minutes: 38, sessions: 2 },
    { day: 'Thu', minutes: 71, sessions: 5 },
    { day: 'Fri', minutes: 55, sessions: 3 },
    { day: 'Sat', minutes: 89, sessions: 6 },
    { day: 'Sun', minutes: 42, sessions: 3 }
  ]);

  const [milestones, setMilestones] = useState([
    { id: 1, title: '100 Signs Mastered', date: '2024-12-10', icon: '💯', achieved: true },
    { id: 2, title: '10 Books Read', date: '2024-12-15', icon: '📚', achieved: false },
    { id: 3, title: 'Level 15 Reached', date: '2024-12-20', icon: '⭐', achieved: false },
    { id: 4, title: '1 Month Streak', date: '2024-12-25', icon: '🔥', achieved: false },
  ]);

  const [learningInsights, setLearningInsights] = useState([
    { type: 'strength', text: 'Excellent progress in Sign Language detection', icon: '💪' },
    { type: 'improvement', text: 'Try to maintain consistent daily practice', icon: '📈' },
    { type: 'suggestion', text: 'Explore more TouchRead features', icon: '💡' },
    { type: 'achievement', text: 'You\'re in the top 10% of learners!', icon: '🏆' },
  ]);

  const getInsightColor = (type) => {
    switch (type) {
      case 'strength': return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'improvement': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case 'suggestion': return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      case 'achievement': return 'bg-purple-500/20 border-purple-500/30 text-purple-300';
      default: return 'bg-white/10 border-white/20 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">📊 Progress & Analytics</h1>
              <p className="text-white/70">Track your learning journey</p>
            </div>
            <div className="flex gap-2">
              {['week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-all ${
                    timeRange === range
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">⏱️</span>
              <span className="text-green-400 text-sm font-semibold">{progressData.signLanguage.improvement}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">26h 31m</div>
            <p className="text-white/70 text-sm">Total Time</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">🎯</span>
              <span className="text-green-400 text-sm font-semibold">+12%</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">135</div>
            <p className="text-white/70 text-sm">Sessions</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">📈</span>
              <span className="text-green-400 text-sm font-semibold">+18%</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">89%</div>
            <p className="text-white/70 text-sm">Avg Accuracy</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-4xl">🔥</span>
              <span className="text-orange-400 text-sm font-semibold">Active</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">14</div>
            <p className="text-white/70 text-sm">Day Streak</p>
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">📅 Weekly Activity</h2>
          <div className="h-64 flex items-end justify-around gap-4">
            {weeklyActivity.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="relative w-full bg-blue-500/20 rounded-t-lg overflow-hidden group cursor-pointer hover:bg-blue-500/30 transition-colors">
                  <div
                    className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg transition-all duration-500"
                    style={{ height: `${(day.minutes / 100) * 240}px` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center pt-2">
                      <div className="text-sm font-bold">{day.minutes}m</div>
                      <div className="text-xs">{day.sessions} sessions</div>
                    </div>
                  </div>
                </div>
                <span className="text-white/70 text-sm mt-2">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Module-wise Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sign Language */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🤟</span>
                Sign Language
              </h3>
              <span className="text-green-400 text-sm font-semibold">{progressData.signLanguage.improvement}</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">{progressData.signLanguage.totalSigns}</div>
                  <p className="text-white/70 text-sm">Signs Learned</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{progressData.signLanguage.accuracy}%</div>
                  <p className="text-white/70 text-sm">Accuracy</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">{progressData.signLanguage.sessionsCompleted}</div>
                  <p className="text-white/70 text-sm">Sessions</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-400">{progressData.signLanguage.timeSpent}</div>
                  <p className="text-white/70 text-sm">Time Spent</p>
                </div>
              </div>
              <div>
                <p className="text-white text-sm mb-2">Recent Signs Practiced:</p>
                <div className="flex gap-2">
                  {progressData.signLanguage.recentSigns.map((sign, idx) => (
                    <div key={idx} className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2 text-white font-bold">
                      {sign}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* TouchRead */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">📖</span>
                TouchRead
              </h3>
              <span className="text-green-400 text-sm font-semibold">{progressData.touchRead.improvement}</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">{progressData.touchRead.booksRead}</div>
                  <p className="text-white/70 text-sm">Books Read</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{progressData.touchRead.wordsRead}</div>
                  <p className="text-white/70 text-sm">Words Read</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">{progressData.touchRead.readingAccuracy}%</div>
                  <p className="text-white/70 text-sm">Accuracy</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-400">{progressData.touchRead.avgReadingSpeed}</div>
                  <p className="text-white/70 text-sm">Reading Speed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sign2Talk */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">💬</span>
                Sign2Talk
              </h3>
              <span className="text-green-400 text-sm font-semibold">{progressData.sign2Talk.improvement}</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">{progressData.sign2Talk.conversations}</div>
                  <p className="text-white/70 text-sm">Conversations</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{progressData.sign2Talk.messagesExchanged}</div>
                  <p className="text-white/70 text-sm">Messages</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">{progressData.sign2Talk.responseTime}</div>
                  <p className="text-white/70 text-sm">Avg Response</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-400">{progressData.sign2Talk.timeSpent}</div>
                  <p className="text-white/70 text-sm">Time Spent</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gamified Learning */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">🎮</span>
                Gamified Learning
              </h3>
              <span className="text-green-400 text-sm font-semibold">{progressData.gamifiedLearning.improvement}</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-400">{progressData.gamifiedLearning.gamesPlayed}</div>
                  <p className="text-white/70 text-sm">Games Played</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{progressData.gamifiedLearning.totalXP}</div>
                  <p className="text-white/70 text-sm">Total XP</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">Lvl {progressData.gamifiedLearning.level}</div>
                  <p className="text-white/70 text-sm">Current Level</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-400">{progressData.gamifiedLearning.badges}</div>
                  <p className="text-white/70 text-sm">Badges Earned</p>
                </div>
              </div>
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-blue-300 text-sm">
                  <strong>Favorite:</strong> {progressData.gamifiedLearning.favoriteGame}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Milestones */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="text-3xl mr-2">🎯</span>
              Upcoming Milestones
            </h2>
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    milestone.achieved
                      ? 'bg-green-500/20 border border-green-500/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <span className="text-4xl">{milestone.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{milestone.title}</h3>
                    <p className="text-white/70 text-sm">Target: {milestone.date}</p>
                  </div>
                  {milestone.achieved && (
                    <span className="text-green-400 text-2xl">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Learning Insights */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
              <span className="text-3xl mr-2">💡</span>
              Learning Insights
            </h2>
            <div className="space-y-3">
              {learningInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                >
                  <span className="text-3xl">{insight.icon}</span>
                  <p className="text-sm">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressAnalytics;
