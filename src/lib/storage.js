const PROGRESS_PREFIX = 'courseit_progress_';
const UNDERSTANDING_PREFIX = 'courseit_understanding_';
const CHECKPOINT_PREFIX = 'courseit_checkpoints_';
const LAST_STEP_PREFIX = 'courseit_last_step_';

/**
 * Retrieves the set of completed step numbers for a given course.
 * 
 * @param {string} courseId 
 * @returns {number[]} Array of completed step numbers
 */
export function getCompletedSteps(courseId) {
  if (!courseId) return [];
  try {
    const raw = localStorage.getItem(PROGRESS_PREFIX + courseId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Retrieves the understanding map for a course:
 * { [stepNumber]: 'understood' | 'needs_review' | 'unknown' }
 */
export function getUnderstandingMap(courseId) {
  if (!courseId) return {};
  try {
    const raw = localStorage.getItem(UNDERSTANDING_PREFIX + courseId);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Retrieves saved checkpoint answers for a course:
 * { [stepNumber]: { selectedIndex: number, isCorrect: boolean } }
 */
export function getCheckpointAnswers(courseId) {
  if (!courseId) return {};
  try {
    const raw = localStorage.getItem(CHECKPOINT_PREFIX + courseId);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Records a user's answer to a checkpoint question.
 * Correct -> sets understanding to 'understood' and marks step complete.
 * Incorrect -> sets understanding to 'needs_review'.
 */
export function recordCheckpointAnswer(courseId, stepNumber, selectedIndex, isCorrect) {
  if (!courseId || stepNumber === undefined) return { completed: [], understanding: {} };

  // Save checkpoint record
  const answers = getCheckpointAnswers(courseId);
  answers[stepNumber] = { selectedIndex, isCorrect, answeredAt: Date.now() };
  try {
    localStorage.setItem(CHECKPOINT_PREFIX + courseId, JSON.stringify(answers));
  } catch (err) {
    console.warn('Failed to save checkpoint answer:', err.message);
  }

  // Update understanding state
  const understanding = getUnderstandingMap(courseId);
  understanding[stepNumber] = isCorrect ? 'understood' : 'needs_review';
  try {
    localStorage.setItem(UNDERSTANDING_PREFIX + courseId, JSON.stringify(understanding));
  } catch (err) {
    console.warn('Failed to save understanding map:', err.message);
  }

  // If correct, ensure step is also marked completed
  let completed = getCompletedSteps(courseId);
  if (isCorrect && !completed.includes(stepNumber)) {
    completed = [...completed, stepNumber];
    try {
      localStorage.setItem(PROGRESS_PREFIX + courseId, JSON.stringify(completed));
    } catch (err) {
      console.warn('Failed to save completed steps:', err.message);
    }
  }

  return { completed, understanding, answers };
}

/**
 * Toggles a step's completion status.
 * Note: manual completion marks completion, but leaves understanding 'unknown'
 * unless a checkpoint was actually attempted.
 * 
 * @param {string} courseId 
 * @param {number} stepNumber 
 * @returns {number[]} Updated array of completed step numbers
 */
export function toggleStep(courseId, stepNumber) {
  if (!courseId || stepNumber === undefined) return [];
  const current = getCompletedSteps(courseId);
  const set = new Set(current);

  if (set.has(stepNumber)) {
    set.delete(stepNumber);
  } else {
    set.add(stepNumber);
  }

  const updated = Array.from(set);
  try {
    localStorage.setItem(PROGRESS_PREFIX + courseId, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save progress to localStorage:', err);
  }

  // Set last active step for resume
  setLastActiveStep(courseId, stepNumber);

  return updated;
}

/**
 * Remembers the last viewed or interacted step for the resume experience.
 */
export function setLastActiveStep(courseId, stepNumber) {
  if (!courseId || stepNumber === undefined) return;
  try {
    localStorage.setItem(LAST_STEP_PREFIX + courseId, String(stepNumber));
  } catch {}
}

/**
 * Retrieves the last active step number (if any).
 */
export function getLastActiveStep(courseId) {
  if (!courseId) return null;
  try {
    const raw = localStorage.getItem(LAST_STEP_PREFIX + courseId);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Calculates learning progress and understanding breakdown:
 * - completed count vs total
 * - understood count
 * - needs review count
 * - not started count
 * - recommended resume step & review step
 */
export function getCourseProgressOverview(courseId, steps = []) {
  const completed = getCompletedSteps(courseId);
  const understanding = getUnderstandingMap(courseId);
  const total = steps.length;

  let understoodCount = 0;
  let needsReviewCount = 0;
  let firstReviewStep = null;
  let firstIncompleteStep = null;

  steps.forEach((step, idx) => {
    const num = step.step_number || (idx + 1);
    const status = understanding[num];

    if (status === 'understood') {
      understoodCount++;
    } else if (status === 'needs_review') {
      needsReviewCount++;
      if (!firstReviewStep) firstReviewStep = step;
    }

    if (!completed.includes(num) && !firstIncompleteStep) {
      firstIncompleteStep = step;
    }
  });

  const notStartedCount = Math.max(0, total - completed.length);
  const resumeStep = firstIncompleteStep || steps[0] || null;

  return {
    completedCount: completed.length,
    totalCount: total,
    understoodCount,
    needsReviewCount,
    notStartedCount,
    resumeStep,
    reviewStep: firstReviewStep
  };
}

/**
 * Clears progress and learning states for a specific course.
 */
export function resetCourseProgress(courseId) {
  if (!courseId) return;
  try {
    localStorage.removeItem(PROGRESS_PREFIX + courseId);
    localStorage.removeItem(UNDERSTANDING_PREFIX + courseId);
    localStorage.removeItem(CHECKPOINT_PREFIX + courseId);
    localStorage.removeItem(LAST_STEP_PREFIX + courseId);
  } catch (err) {
    console.error('Failed to reset progress:', err);
  }
}

/**
 * Permanently clears all CourseIT learning data while preserving auth, preferences, and unrelated data.
 *
 * Deleted:
 * - Generated/cached guest courses (courseit_saved_courses)
 * - Course progress per course (courseit_progress_*)
 * - Course understanding states (courseit_understanding_*)
 * - Checkpoint answers (courseit_checkpoints_*)
 * - Last active steps (courseit_last_step_*)
 * - Guest Tutor quota counter (courseit_guest_quota)
 *
 * Preserved:
 * - Authentication session (appwrite_auth)
 * - Admin mode flag (courseit_admin_mode)
 * - Privacy consent records (courseit_consent_*)
 * - System maintenance flag (courseit_maintenance_mode)
 * - Theme/UI preferences
 * - Usage and credit audit records (server-side only)
 */
export function clearClientLearningData() {
  const keysToDelete = [];

  try {
    // Identify all keys that match CourseIT learning data patterns
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Match CourseIT learning data prefixes
      if (
        key.startsWith(PROGRESS_PREFIX) ||           // courseit_progress_*
        key.startsWith(UNDERSTANDING_PREFIX) ||      // courseit_understanding_*
        key.startsWith(CHECKPOINT_PREFIX) ||         // courseit_checkpoints_*
        key.startsWith(LAST_STEP_PREFIX) ||          // courseit_last_step_*
        key === 'courseit_saved_courses' ||          // cached guest/local courses
        key === 'courseit_guest_quota'               // guest tutor quota
      ) {
        keysToDelete.push(key);
      }
    }

    // Delete all identified keys
    keysToDelete.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn(`Failed to delete storage key "${key}":`, err.message);
      }
    });

    console.log(`[CourseIT] Cleared ${keysToDelete.length} learning data keys from localStorage`);
    return {
      success: true,
      cleared: keysToDelete.length,
      keys: keysToDelete
    };
  } catch (err) {
    console.error('Failed to clear learning data:', err);
    return {
      success: false,
      error: err.message,
      cleared: 0,
      keys: []
    };
  }
}
