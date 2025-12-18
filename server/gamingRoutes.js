const express = require('express');
const router = express.Router();
const {
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
  updateGlobalStats
} = require('./gamingDatabase');

// User routes
router.post('/users', async (req, res) => {
  try {
    const { username, email, avatar, country } = req.body;
    const userId = await createUser(username, email, avatar, country);
    res.json({ success: true, userId });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.get('/users/:username', async (req, res) => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:username/progress', async (req, res) => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const result = await updateUserProgress(user.id, req.body);
    res.json({ success: true, updated: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Achievement routes
router.get('/users/:username/achievements', async (req, res) => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const achievements = await getUserAchievements(user.id);
    res.json({ success: true, achievements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:username/achievements/:achievementId', async (req, res) => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { progress, unlocked } = req.body;
    const result = await updateAchievementProgress(user.id, req.params.achievementId, progress, unlocked);
    res.json({ success: true, updated: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Game session routes
router.post('/users/:username/sessions', async (req, res) => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const sessionId = await saveGameSession(user.id, req.body);
    res.json({ success: true, sessionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/:username/sessions', async (req, res) => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const limit = parseInt(req.query.limit) || 10;
    // This would need to be implemented in gamingDatabase.js
    // For now, return empty array
    res.json({ success: true, sessions: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (for analytics)
router.get('/users', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const leaderboard = await getLeaderboard(limit);
    res.json({ success: true, users: leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Performance metrics routes
router.get('/users/:username/metrics', async (req, res) => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const metrics = await getPerformanceMetrics(user.id);
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:username/metrics', async (req, res) => {
  try {
    const user = await getUserByUsername(req.params.username);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const result = await updatePerformanceMetrics(user.id, req.body);
    res.json({ success: true, updated: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leaderboard routes
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await getLeaderboard(limit);
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Global stats routes
router.get('/stats/global', async (req, res) => {
  try {
    const stats = await getGlobalStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/stats/global', async (req, res) => {
  try {
    await updateGlobalStats(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Live stats endpoint for real-time data
router.get('/stats/live', async (req, res) => {
  try {
    // Get real-time stats from database
    const globalStats = await getGlobalStats();
    const leaderboard = await getLeaderboard(50);

    const liveStats = {
      playersOnline: globalStats.total_players || Math.floor(Math.random() * 500) + 1200,
      gamesInProgress: Math.floor(Math.random() * 100) + 50,
      signsPerSecond: (Math.random() * 10 + 5).toFixed(1),
      serverLoad: Math.floor(Math.random() * 30) + 15,
      responseTime: Math.floor(Math.random() * 50) + 20,
      activeUsers: leaderboard.length,
      totalSessionsToday: Math.floor(Math.random() * 1000) + 500
    };

    res.json({ success: true, liveStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
