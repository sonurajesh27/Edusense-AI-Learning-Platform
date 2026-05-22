/**
 * ASL Model API Client
 * Now connects to the Node.js server with integrated TensorFlow.js model
 */

import API_URL from './config.js';
const ASL_API_URL = API_URL;

/**
 * Check if the ASL API server is running
 */
export async function checkAPIHealth() {
  try {
    const response = await fetch(`${ASL_API_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy' && data.model_loaded;
  } catch (error) {
    console.warn('ASL API not available:', error.message);
    return false;
  }
}

/**
 * Predict ASL sign from hand landmarks using the API
 * @param {Array} landmarks - Hand landmarks from handpose model
 * @returns {Promise<Object>} Prediction result with letter and confidence
 */
export async function predictSignAPI(landmarks) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const response = await fetch(`${ASL_API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ landmarks }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      letter: data.letter,
      confidence: data.confidence,
      topPredictions: data.top_predictions,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('API request timeout');
    } else {
      console.error('Error calling ASL API:', error);
    }
    throw error;
  }
}

/**
 * Predict multiple signs at once
 * @param {Array<Array>} landmarksList - Array of hand landmarks
 * @returns {Promise<Array>} Array of predictions
 */
export async function predictSignsBatch(landmarksList) {
  try {
    const response = await fetch(`${ASL_API_URL}/predict/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ landmarks_list: landmarksList }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.predictions;
  } catch (error) {
    console.error('Error calling batch prediction API:', error);
    throw error;
  }
}

/**
 * Format landmarks for API prediction
 * Converts handpose landmarks to the format expected by the model
 */
export function formatLandmarksForAPI(landmarks) {
  // Flatten and normalize landmarks
  return landmarks.map(point => [point[0], point[1], point[2] || 0]);
}

export default {
  checkAPIHealth,
  predictSignAPI,
  predictSignsBatch,
  formatLandmarksForAPI,
  ASL_API_URL,
};
