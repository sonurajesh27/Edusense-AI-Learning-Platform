const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Gaming database for user data, achievements, and leaderboards
const dbPath = path.join(__dirname, 'gaming_data.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initializeGamingDatabase = () => {
  db.serialize(() => {
    // Users table for player profiles
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      avatar TEXT DEFAULT '👤',
      country TEXT DEFAULT '🌍',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // User progress table
    db.run(`CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      xp_to_next_level INTEGER DEFAULT 100,
      streak INTEGER DEFAULT 0,
      total_signs INTEGER DEFAULT 0,
      best_score INTEGER DEFAULT 0,
      sessions_played INTEGER DEFAULT 0,
      total_play_time REAL DEFAULT 0,
      last_play_date DATE,
      weekly_signs INTEGER DEFAULT 0,
      weekly_games INTEGER DEFAULT 0,
      weekly_time REAL DEFAULT 0,
      monthly_signs INTEGER DEFAULT 0,
      monthly_games INTEGER DEFAULT 0,
      monthly_time REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Achievements table
    db.run(`CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      xp_reward INTEGER NOT NULL,
      target_value INTEGER NOT NULL,
      achievement_type TEXT NOT NULL
    )`);

    // User achievements table (tracks progress and completion)
    db.run(`CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      achievement_id TEXT,
      progress INTEGER DEFAULT 0,
      unlocked BOOLEAN DEFAULT FALSE,
      unlocked_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (achievement_id) REFERENCES achievements (id),
      UNIQUE(user_id, achievement_id)
    )`);

    // Game sessions table
    db.run(`CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      game_mode TEXT NOT NULL,
      score INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      chain_max INTEGER DEFAULT 0,
      signs_detected INTEGER DEFAULT 0,
      signs_correct INTEGER DEFAULT 0,
      duration_seconds INTEGER NOT NULL,
      confidence_avg REAL DEFAULT 0,
      signs_per_minute REAL DEFAULT 0,
      perfect_signs INTEGER DEFAULT 0,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Performance metrics table
    db.run(`CREATE TABLE IF NOT EXISTS performance_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      longest_chain INTEGER DEFAULT 0,
      highest_accuracy REAL DEFAULT 0,
      fastest_sign REAL DEFAULT 0,
      longest_session REAL DEFAULT 0,
      accuracy_trend TEXT, -- JSON array
      speed_trend TEXT, -- JSON array
      score_trend TEXT, -- JSON array
      improvement_areas TEXT, -- JSON array
      recommended_mode TEXT DEFAULT 'ai-trainer',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Global stats table
    db.run(`CREATE TABLE IF NOT EXISTS global_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stat_name TEXT UNIQUE NOT NULL,
      stat_value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Live stats table
    db.run(`CREATE TABLE IF NOT EXISTS live_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      players_online INTEGER DEFAULT 0,
      games_in_progress INTEGER DEFAULT 0,
      signs_per_second REAL DEFAULT 0,
      server_load INTEGER DEFAULT 0,
      response_time INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert default achievements
    const defaultAchievements = [
      ['first-sign', 'First Steps', 'Detect your first sign', '👶', 50, 1, 'signs_total'],
      ['sign-novice', 'Sign Novice', 'Detect 10 signs', '🌱', 100, 10, 'signs_total'],
      ['sign-apprentice', 'Sign Apprentice', 'Detect 50 signs', '📚', 200, 50, 'signs_total'],
      ['sign-expert', 'Sign Expert', 'Detect 100 signs', '🎓', 300, 100, 'signs_total'],
      ['sign-master', 'Sign Master', 'Detect 500 signs', '🏆', 1000, 500, 'signs_total'],
      ['chain-starter', 'Chain Starter', 'Build a 3-sign chain', '⛓️', 100, 3, 'chain_max'],
      ['chain-builder', 'Chain Builder', 'Build a 10-sign chain', '🔗', 250, 10, 'chain_max'],
      ['chain-master', 'Chain Master', 'Build a 20-sign chain', '👑', 500, 20, 'chain_max'],
      ['speed-demon', 'Speed Demon', '10 signs in 30 seconds', '⚡', 200, 10, 'speed_challenge'],
      ['accuracy-ace', 'Accuracy Ace', '95% accuracy in a game', '🎯', 150, 95, 'accuracy'],
      ['perfectionist', 'Perfectionist', '100% accuracy in a game', '💯', 400, 100, 'accuracy'],
      ['ai-whisperer', 'AI Whisperer', 'Perfect AI recognition streak of 20', '🤖', 250, 20, 'streak'],
      ['marathon-runner', 'Marathon Runner', 'Play for 60 minutes straight', '🏃', 300, 60, 'session_time'],
      ['daily-warrior', 'Daily Warrior', 'Play for 7 days straight', '🔥', 500, 7, 'daily_streak'],
      ['level-climber', 'Level Climber', 'Reach level 10', '🧗', 600, 10, 'level'],
      ['score-crusher', 'Score Crusher', 'Score 10,000 points in one game', '💥', 400, 10000, 'single_score']
    ];

    const insertAchievement = db.prepare(`INSERT OR IGNORE INTO achievements 
      (id, title, description, icon, xp_reward, target_value, achievement_type) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`);

    defaultAchievements.forEach(achievement => {
      insertAchievement.run(achievement);
    });
    insertAchievement.finalize();

    // Insert initial global stats
    const globalStatsData = [
      ['total_players', '50000'],
      ['total_games_played', '250000'],
      ['average_accuracy', '78.5'],
      ['top_player', 'SignMaster_Pro'],
      ['active_now', '1200'],
      ['signs_detected_today', '50000'],
      ['top_country', '🇺🇸'],
      ['most_played_mode', 'ai-trainer'],
      ['avg_session_time', '150'],
      ['peak_hour', '18:00']
    ];

    const insertGlobalStat = db.prepare(`INSERT OR REPLACE INTO global_stats (stat_name, stat_value) VALUES (?, ?)`);
    globalStatsData.forEach(stat => {
      insertGlobalStat.run(stat);
    });
    insertGlobalStat.finalize();

    console.log('✅ Gaming database initialized successfully');
  });
};

// User management functions
const createUser = (username, email = null, avatar = '👤', country = '🌍') => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT INTO users (username, email, avatar, country) VALUES (?, ?, ?, ?)`);
    stmt.run([username, email, avatar, country], function(err) {
      if (err) {
        reject(err);
      } else {
        // Create initial progress record
        const progressStmt = db.prepare(`INSERT INTO user_progress (user_id) VALUES (?)`);
        progressStmt.run([this.lastID], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        });
        progressStmt.finalize();
      }
    });
    stmt.finalize();
  });
};

const getUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT u.*, up.* FROM users u 
            LEFT JOIN user_progress up ON u.id = up.user_id 
            WHERE u.username = ?`, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const updateUserProgress = (userId, progressData) => {
  return new Promise((resolve, reject) => {
    const {
      level, xp, xpToNextLevel, streak, totalSigns, bestScore, sessionsPlayed, 
      totalPlayTime, lastPlayDate, weeklySigns, weeklyGames, weeklyTime,
      monthlySigns, monthlyGames, monthlyTime
    } = progressData;

    const stmt = db.prepare(`UPDATE user_progress SET 
      level = ?, xp = ?, xp_to_next_level = ?, streak = ?, total_signs = ?, 
      best_score = ?, sessions_played = ?, total_play_time = ?, last_play_date = ?,
      weekly_signs = ?, weekly_games = ?, weekly_time = ?,
      monthly_signs = ?, monthly_games = ?, monthly_time = ?,
      updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`);

    stmt.run([
      level, xp, xpToNextLevel, streak, totalSigns, bestScore, sessionsPlayed,
      totalPlayTime, lastPlayDate, weeklySigns, weeklyGames, weeklyTime,
      monthlySigns, monthlyGames, monthlyTime, userId
    ], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
    stmt.finalize();
  });
};

// Achievement functions
const getUserAchievements = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT a.*, ua.progress, ua.unlocked, ua.unlocked_at 
            FROM achievements a 
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
            ORDER BY ua.unlocked DESC, a.xp_reward ASC`, [userId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(row => ({
          id: row.id,
          title: row.title,
          description: row.description,
          icon: row.icon,
          xp: row.xp_reward,
          target: row.target_value,
          type: row.achievement_type,
          progress: row.progress || 0,
          unlocked: row.unlocked || false,
          unlockedAt: row.unlocked_at
        })));
      }
    });
  });
};

const updateAchievementProgress = (userId, achievementId, progress, unlocked = false) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`INSERT OR REPLACE INTO user_achievements 
      (user_id, achievement_id, progress, unlocked, unlocked_at) 
      VALUES (?, ?, ?, ?, ?)`);
    
    const unlockedAt = unlocked ? new Date().toISOString() : null;
    
    stmt.run([userId, achievementId, progress, unlocked, unlockedAt], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
    stmt.finalize();
  });
};

// Game session functions
const saveGameSession = (userId, sessionData) => {
  return new Promise((resolve, reject) => {
    const {
      gameMode, score, accuracy, chainMax, signsDetected, signsCorrect,
      duration, confidenceAvg, signsPerMinute, perfectSigns, startedAt, endedAt
    } = sessionData;

    const stmt = db.prepare(`INSERT INTO game_sessions 
      (user_id, game_mode, score, accuracy, chain_max, signs_detected, signs_correct,
       duration_seconds, confidence_avg, signs_per_minute, perfect_signs, started_at, ended_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    stmt.run([
      userId, gameMode, score, accuracy, chainMax, signsDetected, signsCorrect,
      duration, confidenceAvg, signsPerMinute, perfectSigns, startedAt, endedAt
    ], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
    stmt.finalize();
  });
};

// Leaderboard functions
const getLeaderboard = (limit = 10) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT u.username, u.avatar, u.country, 
                   up.level, up.best_score as score, up.streak, up.total_signs,
                   up.sessions_played,
                   (CASE WHEN up.last_play_date = date('now') THEN 1 ELSE 0 END) as is_online,
                   up.last_play_date as last_seen
            FROM users u 
            JOIN user_progress up ON u.id = up.user_id 
            ORDER BY up.best_score DESC, up.level DESC 
            LIMIT ?`, [limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map((row, index) => ({
          rank: index + 1,
          name: row.username,
          avatar: row.avatar,
          country: row.country,
          level: row.level,
          score: row.score,
          streak: row.streak,
          totalSigns: row.total_signs,
          gamesPlayed: row.sessions_played,
          isOnline: row.is_online === 1,
          lastSeen: row.last_seen,
          accuracy: Math.round(75 + Math.random() * 20) // Simulated for now
        })));
      }
    });
  });
};

// Performance metrics functions
const getPerformanceMetrics = (userId) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM performance_metrics WHERE user_id = ?`, [userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (!row) {
          // Create default metrics if none exist
          const defaultMetrics = {
            longest_chain: 0,
            highest_accuracy: 0,
            fastest_sign: 0,
            longest_session: 0,
            accuracy_trend: '[]',
            speed_trend: '[]',
            score_trend: '[]',
            improvement_areas: '["Sign Recognition"]',
            recommended_mode: 'ai-trainer'
          };
          
          const stmt = db.prepare(`INSERT INTO performance_metrics 
            (user_id, longest_chain, highest_accuracy, fastest_sign, longest_session,
             accuracy_trend, speed_trend, score_trend, improvement_areas, recommended_mode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
          
          stmt.run([
            userId, defaultMetrics.longest_chain, defaultMetrics.highest_accuracy,
            defaultMetrics.fastest_sign, defaultMetrics.longest_session,
            defaultMetrics.accuracy_trend, defaultMetrics.speed_trend,
            defaultMetrics.score_trend, defaultMetrics.improvement_areas,
            defaultMetrics.recommended_mode
          ], function(insertErr) {
            if (insertErr) {
              reject(insertErr);
            } else {
              resolve({
                personalBest: {
                  longestChain: defaultMetrics.longest_chain,
                  highestAccuracy: defaultMetrics.highest_accuracy,
                  fastestSign: defaultMetrics.fastest_sign,
                  longestSession: defaultMetrics.longest_session
                },
                recentTrends: {
                  accuracyTrend: JSON.parse(defaultMetrics.accuracy_trend),
                  speedTrend: JSON.parse(defaultMetrics.speed_trend),
                  scoreTrend: JSON.parse(defaultMetrics.score_trend)
                },
                predictions: {
                  improvementAreas: JSON.parse(defaultMetrics.improvement_areas),
                  recommendedMode: defaultMetrics.recommended_mode,
                  nextLevelETA: 5
                }
              });
            }
          });
          stmt.finalize();
        } else {
          resolve({
            personalBest: {
              longestChain: row.longest_chain,
              highestAccuracy: row.highest_accuracy,
              fastestSign: row.fastest_sign,
              longestSession: row.longest_session
            },
            recentTrends: {
              accuracyTrend: JSON.parse(row.accuracy_trend || '[]'),
              speedTrend: JSON.parse(row.speed_trend || '[]'),
              scoreTrend: JSON.parse(row.score_trend || '[]')
            },
            predictions: {
              improvementAreas: JSON.parse(row.improvement_areas || '[]'),
              recommendedMode: row.recommended_mode,
              nextLevelETA: 5 // Calculate based on current progress
            }
          });
        }
      }
    });
  });
};

const updatePerformanceMetrics = (userId, metrics) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`UPDATE performance_metrics SET 
      longest_chain = ?, highest_accuracy = ?, fastest_sign = ?, longest_session = ?,
      accuracy_trend = ?, speed_trend = ?, score_trend = ?,
      improvement_areas = ?, recommended_mode = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`);

    stmt.run([
      metrics.personalBest.longestChain,
      metrics.personalBest.highestAccuracy,
      metrics.personalBest.fastestSign,
      metrics.personalBest.longestSession,
      JSON.stringify(metrics.recentTrends.accuracyTrend),
      JSON.stringify(metrics.recentTrends.speedTrend),
      JSON.stringify(metrics.recentTrends.scoreTrend),
      JSON.stringify(metrics.predictions.improvementAreas),
      metrics.predictions.recommendedMode,
      userId
    ], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
    stmt.finalize();
  });
};

// Global stats functions
const getGlobalStats = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT stat_name, stat_value FROM global_stats`, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const stats = {};
        rows.forEach(row => {
          stats[row.stat_name] = row.stat_value;
        });
        resolve({
          totalPlayers: parseInt(stats.total_players || 0),
          totalGamesPlayed: parseInt(stats.total_games_played || 0),
          averageAccuracy: parseFloat(stats.average_accuracy || 0),
          topPlayer: stats.top_player || 'Unknown',
          activeNow: parseInt(stats.active_now || 0),
          signsDetectedToday: parseInt(stats.signs_detected_today || 0),
          topCountry: stats.top_country || '🌍',
          trending: {
            mostPlayedMode: stats.most_played_mode || 'ai-trainer',
            avgSessionTime: parseInt(stats.avg_session_time || 0),
            peakHour: stats.peak_hour || '18:00'
          }
        });
      }
    });
  });
};

const updateGlobalStats = (statsData) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`UPDATE global_stats SET stat_value = ?, updated_at = CURRENT_TIMESTAMP WHERE stat_name = ?`);
    
    const promises = Object.entries(statsData).map(([key, value]) => {
      return new Promise((res, rej) => {
        stmt.run([value.toString(), key], (err) => {
          if (err) rej(err);
          else res();
        });
      });
    });

    Promise.all(promises)
      .then(() => {
        stmt.finalize();
        resolve();
      })
      .catch(reject);
  });
};

// Export all functions
module.exports = {
  initializeGamingDatabase,
  createUser,
  getUserByUsername,
  updateUserProgress,
  getUserAchievements,
  updateAchievementProgress,
  saveGameSession,
  getLeaderboard,
  getPerformanceMetrics,
  updatePerformanceMetrics,
  getGlobalStats,
  updateGlobalStats,
  db
};
