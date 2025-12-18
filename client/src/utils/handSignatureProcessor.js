/**
 * Hand Signature Processor
 * Advanced hand landmark processing for better gesture recognition
 */

/**
 * Normalize hand landmarks relative to wrist position
 * This makes the recognition invariant to hand position and size
 */
export function normalizeHandLandmarks(landmarks) {
  if (!landmarks || landmarks.length !== 21) {
    throw new Error('Expected 21 hand landmarks');
  }

  // Get wrist position (landmark 0)
  const wrist = landmarks[0];

  // Calculate bounding box to get hand size
  const xs = landmarks.map(p => p[0]);
  const ys = landmarks.map(p => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = maxX - minX;
  const height = maxY - minY;
  const scale = Math.max(width, height);

  // Normalize each landmark
  const normalized = landmarks.map(point => [
    (point[0] - wrist[0]) / scale,
    (point[1] - wrist[1]) / scale,
    (point[2] - wrist[2]) / scale
  ]);

  return normalized;
}

/**
 * Extract hand signature features from landmarks
 * Creates a unique signature for each hand pose
 */
export function extractHandSignature(landmarks) {
  const normalized = normalizeHandLandmarks(landmarks);

  // Calculate finger angles and distances
  const features = [];

  // Finger tip indices: thumb=4, index=8, middle=12, ring=16, pinky=20
  const fingerTips = [4, 8, 12, 16, 20];
  const fingerBases = [2, 5, 9, 13, 17]; // MCP joints

  // 1. Calculate finger extension (tip to base distance)
  fingerTips.forEach((tipIdx, i) => {
    const baseIdx = fingerBases[i];
    const tip = normalized[tipIdx];
    const base = normalized[baseIdx];
    const distance = Math.sqrt(
      Math.pow(tip[0] - base[0], 2) +
      Math.pow(tip[1] - base[1], 2) +
      Math.pow(tip[2] - base[2], 2)
    );
    features.push(distance);
  });

  // 2. Calculate angles between fingers
  for (let i = 0; i < fingerTips.length - 1; i++) {
    const finger1 = normalized[fingerTips[i]];
    const finger2 = normalized[fingerTips[i + 1]];
    const angle = Math.atan2(finger2[1] - finger1[1], finger2[0] - finger1[0]);
    features.push(angle);
  }

  // 3. Calculate palm orientation (using wrist and middle finger base)
  const wrist = normalized[0];
  const middleBase = normalized[9];
  const palmAngle = Math.atan2(middleBase[1] - wrist[1], middleBase[0] - wrist[0]);
  features.push(palmAngle);

  // 4. Calculate finger curl (distance from tip to palm center)
  const palmCenter = normalized[0]; // Using wrist as palm center
  fingerTips.forEach(tipIdx => {
    const tip = normalized[tipIdx];
    const curlDistance = Math.sqrt(
      Math.pow(tip[0] - palmCenter[0], 2) +
      Math.pow(tip[1] - palmCenter[1], 2)
    );
    features.push(curlDistance);
  });

  return features;
}

/**
 * Calculate hand pose confidence based on landmark stability
 */
export function calculatePoseConfidence(landmarks, previousLandmarks) {
  if (!previousLandmarks || previousLandmarks.length !== 21) {
    return 0.5; // Default confidence for first detection
  }

  // Calculate average movement between frames
  let totalMovement = 0;
  for (let i = 0; i < landmarks.length; i++) {
    const dx = landmarks[i][0] - previousLandmarks[i][0];
    const dy = landmarks[i][1] - previousLandmarks[i][1];
    const dz = landmarks[i][2] - previousLandmarks[i][2];
    totalMovement += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  const avgMovement = totalMovement / landmarks.length;

  // Less movement = higher confidence (stable hand pose)
  const confidence = Math.max(0.5, 1.0 - (avgMovement / 20));

  return confidence;
}

/**
 * Detect if hand is in a stable pose (not moving much)
 */
export function isHandStable(landmarks, previousLandmarks, threshold = 5) {
  if (!previousLandmarks) return false; // Require stability check

  let totalMovement = 0;
  for (let i = 0; i < landmarks.length; i++) {
    const dx = landmarks[i][0] - previousLandmarks[i][0];
    const dy = landmarks[i][1] - previousLandmarks[i][1];
    totalMovement += Math.sqrt(dx * dx + dy * dy);
  }

  const avgMovement = totalMovement / landmarks.length;
  return avgMovement < threshold;
}

/**
 * Enhanced preprocessing for API prediction
 * Applies normalization and centering
 */
export function preprocessForPrediction(landmarks) {
  // Normalize landmarks
  const normalized = normalizeHandLandmarks(landmarks);

  // Flatten for API
  return normalized;
}

/**
 * Calculate hand orientation (left/right hand detection)
 */
export function detectHandOrientation(landmarks) {
  // Using thumb and pinky positions to determine orientation
  const thumb = landmarks[4];
  const pinky = landmarks[20];

  // If thumb is to the left of pinky, it's likely a right hand
  // If thumb is to the right of pinky, it's likely a left hand
  const isRightHand = thumb[0] < pinky[0];

  return {
    isRightHand,
    isLeftHand: !isRightHand
  };
}

/**
 * Filter out noisy detections
 */
export function isValidHandPose(landmarks) {
  if (!landmarks || landmarks.length !== 21) return false;

  // Check if all landmarks are within reasonable bounds
  const allValid = landmarks.every(point => {
    return point[0] >= 0 && point[0] <= 1000 &&
           point[1] >= 0 && point[1] <= 1000 &&
           Math.abs(point[2]) < 500; // Z-depth check
  });

  if (!allValid) return false;

  // Check if hand is reasonably sized (not too small or too large)
  const xs = landmarks.map(p => p[0]);
  const ys = landmarks.map(p => p[1]);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);

  // Hand should be at least 50 pixels and at most 500 pixels
  return width > 50 && width < 500 && height > 50 && height < 500;
}

export default {
  normalizeHandLandmarks,
  extractHandSignature,
  calculatePoseConfidence,
  isHandStable,
  preprocessForPrediction,
  detectHandOrientation,
  isValidHandPose
};
