/**
 * Gesture Data Collector Service
 * Captures and stores hand gesture data for personalized learning
 * Uses backend SQLite database instead of localStorage for persistence
 */

class GestureDataCollector {
  constructor() {
    this.isCollecting = false;
    this.sessionId = this.generateSessionId();
    this.userProfile = this.initializeUserProfile();
    this.apiEndpoint = 'http://localhost:5000/api/gestures'; // Backend endpoint
    this.batchSize = 5; // Send data in smaller batches for responsiveness
    this.pendingBatch = [];
    this.lastSyncTime = Date.now();
    this.isOnline = navigator.onLine;

    // Set up online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.retrySyncData();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Generate unique session ID for tracking
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize user profile (in-memory only, backend stores everything)
   */
  initializeUserProfile() {
    return {
      userId: `user_${Math.random().toString(36).substr(2, 9)}`,
      sessionStart: new Date().toISOString(),
      sessionGestures: 0,
      tempGestureAccuracy: {},
      handSize: null,
      dominantHand: null
    };
  }

  /**
   * Start collecting gesture data
   */
  startCollecting() {
    this.isCollecting = true;
    console.log('🎯 Gesture data collection started');
  }

  /**
   * Stop collecting gesture data
   */
  stopCollecting() {
    this.isCollecting = false;
    // Send any pending data immediately
    if (this.pendingBatch.length > 0) {
      this.sendBatchToBackend();
    }
    console.log('⏸️ Gesture data collection stopped');
  }

  /**
   * Capture gesture data when a gesture is detected
   */
  captureGesture(gestureData) {
    if (!this.isCollecting) return;

    const captureData = {
      id: `gesture_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId: this.sessionId,
      userId: this.userProfile.userId,
      timestamp: new Date().toISOString(),
      ...gestureData
    };

    // Add to pending batch
    this.pendingBatch.push(captureData);

    // Update in-memory session stats
    this.userProfile.sessionGestures++;
    if (gestureData.detectedSign) {
      if (!this.userProfile.tempGestureAccuracy[gestureData.detectedSign]) {
        this.userProfile.tempGestureAccuracy[gestureData.detectedSign] = {
          attempts: 0,
          successful: 0
        };
      }
      
      const signStats = this.userProfile.tempGestureAccuracy[gestureData.detectedSign];
      signStats.attempts++;
      
      if (gestureData.confidence > 0.8) {
        signStats.successful++;
      }
    }

    // Estimate hand size from landmarks if not set
    if (!this.userProfile.handSize && gestureData.landmarks) {
      this.userProfile.handSize = this.estimateHandSize(gestureData.landmarks);
    }

    // Send batch when full or after time interval
    if (this.pendingBatch.length >= this.batchSize || 
        (Date.now() - this.lastSyncTime > 10000)) { // 10 second interval
      this.sendBatchToBackend();
    }
  }

  /**
   * Estimate hand size from landmarks
   */
  estimateHandSize(landmarks) {
    try {
      // Calculate distance from wrist to middle finger tip
      const wrist = landmarks[0];
      const middleTip = landmarks[12];
      
      const distance = Math.sqrt(
        Math.pow(middleTip[0] - wrist[0], 2) + 
        Math.pow(middleTip[1] - wrist[1], 2)
      );
      
      // Categorize hand size
      if (distance < 120) return 'small';
      if (distance < 160) return 'medium';
      return 'large';
    } catch (error) {
      console.warn('Could not estimate hand size:', error);
      return 'unknown';
    }
  }

  /**
   * Send batch of gesture data to backend
   */
  async sendBatchToBackend() {
    if (this.pendingBatch.length === 0 || !this.isOnline) return;

    const batchData = {
      sessionId: this.sessionId,
      userId: this.userProfile.userId,
      timestamp: new Date().toISOString(),
      gestures: [...this.pendingBatch],
      userProfile: this.userProfile,
      batchStats: {
        totalGestures: this.pendingBatch.length,
        uniqueSigns: [...new Set(this.pendingBatch.map(g => g.detectedSign))].length,
        avgConfidence: this.pendingBatch.reduce((sum, g) => sum + (g.confidence || 0), 0) / this.pendingBatch.length,
        sessionGestures: this.userProfile.sessionGestures
      }
    };

    try {
      // Send to backend SQLite database
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Sent ${this.pendingBatch.length} gestures to database`);
        console.log(`📊 Total stored: ${result.totalGestures} gestures`);
        this.pendingBatch = []; // Clear batch after successful send
        this.lastSyncTime = Date.now();
      } else {
        throw new Error(`Backend responded with status: ${response.status}`);
      }
    } catch (error) {
      console.warn('⚠️ Could not sync to backend database:', error.message);
      // Keep gestures in memory for retry (but limit size to prevent memory issues)
      if (this.pendingBatch.length > 100) {
        this.pendingBatch = this.pendingBatch.slice(-50); // Keep only recent 50
      }
    }
  }

  /**
   * Retry syncing data when connection is restored
   */
  async retrySyncData() {
    if (this.pendingBatch.length > 0) {
      console.log('🔄 Retrying gesture data sync...');
      await this.sendBatchToBackend();
    }

    // Try to get updated user profile from backend
    try {
      const response = await fetch(`http://localhost:5000/api/gestures/stats/${this.userProfile.userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📈 Retrieved user stats from database:', data.stats);
      }
    } catch (error) {
      console.warn('Could not retrieve user stats:', error.message);
    }
  }

  /**
   * Get user's gesture statistics from backend
   */
  async getGestureStats() {
    try {
      const response = await fetch(`http://localhost:5000/api/gestures/stats/${this.userProfile.userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.stats;
      }
      throw new Error('Failed to fetch stats');
    } catch (error) {
      console.warn('Could not get gesture stats from database:', error.message);
      // Return session stats as fallback
      return {
        userId: this.userProfile.userId,
        sessionGestures: this.userProfile.sessionGestures,
        tempAccuracy: this.userProfile.tempGestureAccuracy,
        handSize: this.userProfile.handSize,
        isOfflineMode: !this.isOnline
      };
    }
  }

  /**
   * Get personalized gesture confidence threshold based on user's history
   */
  async getPersonalizedThreshold(signName) {
    try {
      const response = await fetch(`http://localhost:5000/api/gestures/thresholds/${this.userProfile.userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.thresholds[signName] || 0.8; // Default threshold
      }
      throw new Error('Failed to fetch thresholds');
    } catch (error) {
      console.warn('Could not get personalized thresholds:', error.message);
      return 0.8; // Default threshold
    }
  }

  /**
   * Get session statistics (in-memory)
   */
  getSessionStats() {
    return {
      sessionId: this.sessionId,
      sessionGestures: this.userProfile.sessionGestures,
      pendingSync: this.pendingBatch.length,
      handSize: this.userProfile.handSize,
      tempAccuracy: this.userProfile.tempGestureAccuracy,
      isOnline: this.isOnline,
      lastSync: new Date(this.lastSyncTime).toLocaleTimeString()
    };
  }

  /**
   * Clean up session data
   */
  cleanup() {
    this.stopCollecting();
    this.pendingBatch = [];
    console.log('🧹 Gesture collector session cleaned up');
  }

  /**
   * Force sync all pending data
   */
  async forceSyncNow() {
    if (this.pendingBatch.length > 0) {
      console.log('🚀 Force syncing gesture data...');
      await this.sendBatchToBackend();
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      pendingGestures: this.pendingBatch.length,
      lastSync: this.lastSyncTime,
      userId: this.userProfile.userId
    };
  }
}

// Create singleton instance
const gestureDataCollector = new GestureDataCollector();

// Auto-start collection
gestureDataCollector.startCollecting();

// Cleanup on page unload and force sync
window.addEventListener('beforeunload', async () => {
  await gestureDataCollector.forceSyncNow();
  gestureDataCollector.cleanup();
});

// Periodic sync every 30 seconds
setInterval(() => {
  if (gestureDataCollector.pendingBatch.length > 0 && gestureDataCollector.isOnline) {
    gestureDataCollector.sendBatchToBackend();
  }
}, 30000);

export default gestureDataCollector;
