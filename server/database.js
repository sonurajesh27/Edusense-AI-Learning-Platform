const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, 'gesture_learning.db');

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database for gesture learning');
    initializeTables();
  }
});

// Create tables if they don't exist
function initializeTables() {
  // User profiles table
  db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_gestures INTEGER DEFAULT 0,
    hand_size TEXT,
    dominant_hand TEXT,
    average_accuracy REAL DEFAULT 0.0,
    session_count INTEGER DEFAULT 0
  )`, (err) => {
    if (err) {
      console.error('Error creating user_profiles table:', err.message);
    } else {
      console.log('📊 User profiles table ready');
    }
  });

  // Gesture accuracy stats table
  db.run(`CREATE TABLE IF NOT EXISTS gesture_accuracy (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    gesture_sign TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    successful INTEGER DEFAULT 0,
    average_confidence REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles (user_id),
    UNIQUE(user_id, gesture_sign)
  )`, (err) => {
    if (err) {
      console.error('Error creating gesture_accuracy table:', err.message);
    } else {
      console.log('📈 Gesture accuracy table ready');
    }
  });

  // Individual gesture data table
  db.run(`CREATE TABLE IF NOT EXISTS gesture_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    gesture_id TEXT UNIQUE NOT NULL,
    landmarks TEXT NOT NULL, -- JSON string of landmarks
    detected_sign TEXT,
    confidence REAL DEFAULT 0.0,
    recognition_method TEXT,
    session_context TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    video_width INTEGER,
    video_height INTEGER,
    hand_size_estimate TEXT,
    recognition_failed BOOLEAN DEFAULT 0,
    game_context TEXT, -- JSON string for game-related data
    model_accuracy TEXT,
    FOREIGN KEY (user_id) REFERENCES user_profiles (user_id)
  )`, (err) => {
    if (err) {
      console.error('Error creating gesture_data table:', err.message);
    } else {
      console.log('🤲 Gesture data table ready');
    }
  });

  // Gesture batches table for batch processing
  db.run(`CREATE TABLE IF NOT EXISTS gesture_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    gesture_count INTEGER DEFAULT 0,
    unique_signs INTEGER DEFAULT 0,
    average_confidence REAL DEFAULT 0.0,
    session_context TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_retry BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES user_profiles (user_id)
  )`, (err) => {
    if (err) {
      console.error('Error creating gesture_batches table:', err.message);
    } else {
      console.log('📦 Gesture batches table ready');
    }
  });

  // Personalized thresholds table
  db.run(`CREATE TABLE IF NOT EXISTS personalized_thresholds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    gesture_sign TEXT NOT NULL,
    threshold REAL DEFAULT 0.8,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_profiles (user_id),
    UNIQUE(user_id, gesture_sign)
  )`, (err) => {
    if (err) {
      console.error('Error creating personalized_thresholds table:', err.message);
    } else {
      console.log('🎯 Personalized thresholds table ready');
    }
  });

  console.log('🗄️ All gesture learning database tables initialized');
}

// Database operations
const dbOperations = {
  // User Profile Operations
  async createUserProfile(userData) {
    return new Promise((resolve, reject) => {
      const { userId, handSize, dominantHand } = userData;
      
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO user_profiles 
        (user_id, hand_size, dominant_hand, updated_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([userId, handSize, dominantHand], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ userId, changes: this.changes });
        }
      });
      
      stmt.finalize();
    });
  },

  async getUserProfile(userId) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM user_profiles WHERE user_id = ?
      `, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  async updateUserStats(userId, stats) {
    return new Promise((resolve, reject) => {
      const { totalGestures, averageAccuracy, sessionCount } = stats;
      
      const stmt = db.prepare(`
        UPDATE user_profiles 
        SET total_gestures = ?, average_accuracy = ?, session_count = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `);
      
      stmt.run([totalGestures, averageAccuracy, sessionCount, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
      
      stmt.finalize();
    });
  },

  // Gesture Data Operations
  async storeGestureData(gestureData) {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO gesture_data (
          user_id, session_id, gesture_id, landmarks, detected_sign, confidence,
          recognition_method, session_context, video_width, video_height,
          hand_size_estimate, recognition_failed, game_context, model_accuracy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const values = [
        gestureData.userId,
        gestureData.sessionId,
        gestureData.id,
        JSON.stringify(gestureData.landmarks),
        gestureData.detectedSign,
        gestureData.confidence,
        gestureData.recognitionMethod,
        gestureData.sessionContext,
        gestureData.videoConstraints?.width,
        gestureData.videoConstraints?.height,
        gestureData.handSizeEstimate,
        gestureData.recognitionFailed ? 1 : 0,
        gestureData.gameContext ? JSON.stringify(gestureData.gameContext) : null,
        gestureData.modelAccuracy
      ];

      stmt.run(values, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });

      stmt.finalize();
    });
  },

  async getGestureHistory(userId, limit = 100) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM gesture_data 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [userId, limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Gesture Accuracy Operations
  async updateGestureAccuracy(userId, gestureSign, confidence, isSuccessful) {
    return new Promise((resolve, reject) => {
      // First, get current stats
      db.get(`
        SELECT * FROM gesture_accuracy 
        WHERE user_id = ? AND gesture_sign = ?
      `, [userId, gestureSign], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        let attempts = 1;
        let successful = isSuccessful ? 1 : 0;
        let avgConfidence = confidence;

        if (row) {
          attempts = row.attempts + 1;
          successful = row.successful + (isSuccessful ? 1 : 0);
          avgConfidence = ((row.average_confidence * row.attempts) + confidence) / attempts;
        }

        const stmt = db.prepare(`
          INSERT OR REPLACE INTO gesture_accuracy 
          (user_id, gesture_sign, attempts, successful, average_confidence, updated_at)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);

        stmt.run([userId, gestureSign, attempts, successful, avgConfidence], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ 
              gestureSign, 
              attempts, 
              successful, 
              avgConfidence, 
              accuracy: successful / attempts 
            });
          }
        });

        stmt.finalize();
      });
    });
  },

  async getGestureAccuracy(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM gesture_accuracy 
        WHERE user_id = ? 
        ORDER BY attempts DESC
      `, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },

  // Personalized Thresholds Operations
  async updatePersonalizedThreshold(userId, gestureSign, threshold) {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO personalized_thresholds 
        (user_id, gesture_sign, threshold, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `);

      stmt.run([userId, gestureSign, threshold], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ gestureSign, threshold, changes: this.changes });
        }
      });

      stmt.finalize();
    });
  },

  async getPersonalizedThresholds(userId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT gesture_sign, threshold FROM personalized_thresholds 
        WHERE user_id = ?
      `, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const thresholds = {};
          rows.forEach(row => {
            thresholds[row.gesture_sign] = row.threshold;
          });
          resolve(thresholds);
        }
      });
    });
  },

  // Batch Operations
  async storeBatch(batchData) {
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO gesture_batches 
        (batch_id, user_id, session_id, gesture_count, unique_signs, average_confidence, session_context, is_retry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        batchData.batchId,
        batchData.userId,
        batchData.sessionId,
        batchData.gestureCount,
        batchData.uniqueSigns,
        batchData.averageConfidence,
        batchData.sessionContext,
        batchData.isRetry ? 1 : 0
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });

      stmt.finalize();
    });
  },

  // Analytics Operations
  async getAnalytics() {
    return new Promise((resolve, reject) => {
      const analytics = {};

      // Get basic stats
      db.get(`
        SELECT 
          COUNT(DISTINCT user_id) as total_users,
          COUNT(*) as total_gestures,
          AVG(confidence) as avg_confidence
        FROM gesture_data
      `, (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        analytics.totalUsers = row.total_users || 0;
        analytics.totalGestures = row.total_gestures || 0;
        analytics.averageConfidence = row.avg_confidence || 0;

        // Get sign frequency
        db.all(`
          SELECT detected_sign, COUNT(*) as count
          FROM gesture_data 
          WHERE detected_sign IS NOT NULL
          GROUP BY detected_sign 
          ORDER BY count DESC 
          LIMIT 10
        `, (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          analytics.topSigns = rows.map(row => ({
            sign: row.detected_sign,
            count: row.count
          }));

          // Get recent activity
          db.all(`
            SELECT user_id, session_context, COUNT(*) as gesture_count, timestamp
            FROM gesture_data 
            GROUP BY user_id, session_id
            ORDER BY timestamp DESC 
            LIMIT 10
          `, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              analytics.recentActivity = rows;
              resolve(analytics);
            }
          });
        });
      });
    });
  },

  // Cleanup old data
  async cleanupOldData(daysToKeep = 30) {
    return new Promise((resolve, reject) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      db.run(`
        DELETE FROM gesture_data 
        WHERE timestamp < ?
      `, [cutoffDate.toISOString()], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`🧹 Cleaned up ${this.changes} old gesture records`);
          resolve({ deletedRecords: this.changes });
        }
      });
    });
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Closing database connection...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});

module.exports = { db, dbOperations };
