// Gaming API Service for client-side integration

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/gaming';

class GamingAPIService {
  // User management
  static async createUser(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  static async getUserByUsername(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  static async updateUserProgress(username, progressData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to update user progress:', error);
      throw error;
    }
  }

  // Achievement management
  static async getUserAchievements(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}/achievements`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get achievements:', error);
      throw error;
    }
  }

  static async updateAchievementProgress(username, achievementId, progress, unlocked = false) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}/achievements/${achievementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress, unlocked })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to update achievement:', error);
      throw error;
    }
  }

  // Game session management
  static async saveGameSession(username, sessionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to save game session:', error);
      throw error;
    }
  }

  // Performance metrics
  static async getPerformanceMetrics(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}/metrics`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  static async updatePerformanceMetrics(username, metrics) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}/metrics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to update performance metrics:', error);
      throw error;
    }
  }

  // Leaderboard
  static async getLeaderboard(limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard?limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      throw error;
    }
  }

  // Global stats
  static async getGlobalStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/global`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get global stats:', error);
      throw error;
    }
  }

  static async getLiveStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/stats/live`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get live stats:', error);
      throw error;
    }
  }

  // Get user session history
  static async getUserSessions(username, limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}/sessions?limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      throw error;
    }
  }

  // Get all users (for admin/analytics)
  static async getAllUsers(limit = 100) {
    try {
      const response = await fetch(`${API_BASE_URL}/users?limit=${limit}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get all users:', error);
      throw error;
    }
  }

  // Utility methods for local fallback
  static getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get from localStorage:', error);
      return null;
    }
  }

  static saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // Auto-sync method that tries API first, falls back to localStorage
  static async getOrCreateUser(username, defaultUserData = {}) {
    try {
      // Try to get user from API
      const response = await this.getUserByUsername(username);
      if (response.success) {
        return response.user;
      }
      
      // If user doesn't exist, create them
      if (response.error === 'User not found') {
        const createResponse = await this.createUser({
          username,
          email: defaultUserData.email || null,
          avatar: defaultUserData.avatar || '👤',
          country: defaultUserData.country || '🌍'
        });
        
        if (createResponse.success) {
          // Get the newly created user
          const newUserResponse = await this.getUserByUsername(username);
          return newUserResponse.user;
        }
      }
      
      throw new Error('Failed to get or create user');
    } catch (error) {
      console.warn('API unavailable, using localStorage fallback:', error);
      
      // Fallback to localStorage
      let user = this.getFromLocalStorage(`user_${username}`);
      if (!user) {
        user = {
          username,
          level: 1,
          xp: 0,
          xp_to_next_level: 100,
          streak: 0,
          total_signs: 0,
          best_score: 0,
          sessions_played: 0,
          total_play_time: 0,
          last_play_date: new Date().toDateString(),
          ...defaultUserData
        };
        this.saveToLocalStorage(`user_${username}`, user);
      }
      return user;
    }
  }

  // Batch sync method for offline/online sync
  static async syncUserData(username, userData) {
    try {
      // Try to sync with API
      await this.updateUserProgress(username, userData);
      
      // Also save locally as backup
      this.saveToLocalStorage(`user_${username}`, userData);
      
      return { success: true, synced: true };
    } catch (error) {
      console.warn('API sync failed, saving locally:', error);
      
      // Save locally and mark for later sync
      this.saveToLocalStorage(`user_${username}`, userData);
      this.saveToLocalStorage(`sync_pending_${username}`, true);
      
      return { success: true, synced: false, pendingSync: true };
    }
  }

  // Check and perform pending syncs when API is available
  static async syncPendingData(username) {
    try {
      const hasPendingSync = this.getFromLocalStorage(`sync_pending_${username}`);
      if (!hasPendingSync) return { success: true, message: 'No pending sync' };
      
      const userData = this.getFromLocalStorage(`user_${username}`);
      if (!userData) return { success: false, error: 'No local data to sync' };
      
      // Try to sync
      await this.updateUserProgress(username, userData);
      
      // Clear pending sync flag
      localStorage.removeItem(`sync_pending_${username}`);
      
      return { success: true, message: 'Sync completed' };
    } catch (error) {
      console.error('Pending sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Performance Metrics Management
  static async getPerformanceMetrics(username) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}/metrics`);
      if (!response.ok) throw new Error('API call failed');
      
      const result = await response.json();
      return { success: true, metrics: result.metrics };
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      
      // Fallback to localStorage
      try {
        const saved = localStorage.getItem(`performance_metrics_${username}`);
        return { 
          success: true, 
          metrics: saved ? JSON.parse(saved) : null 
        };
      } catch {
        return { success: false, error: error.message };
      }
    }
  }

  static async savePerformanceMetrics(username, metrics) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${username}/metrics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
      
      if (!response.ok) throw new Error('API call failed');
      
      return await response.json();
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
      
      // Fallback to localStorage
      try {
        localStorage.setItem(`performance_metrics_${username}`, JSON.stringify(metrics));
        localStorage.setItem(`sync_pending_${username}_metrics`, 'true');
        return { success: false, fallback: true, error: error.message };
      } catch {
        return { success: false, error: error.message };
      }
    }
  }
}

export default GamingAPIService;
