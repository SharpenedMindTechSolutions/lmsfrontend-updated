import { useEffect, useRef, useState } from 'react';
import { timeTrackingAPI } from '../services/student/api';

/**
 * useActiveTimeTracker
 * Smart Hook that tracks active presence on the platform.
 * Automatically pauses when:
 * 1. Document is hidden / user switches tabs (`visibilitychange`).
 * 2. Window is blurred / minimized (`blur`).
 * 3. User is idle for > 60 seconds without interaction.
 * 
 * Periodically syncs verified active seconds with the backend every 30s.
 * 
 * @param {object} options
 * @param {string} [options.courseId] - Optional current course context
 * @param {string} [options.activityType] - 'video' | 'game' | 'quiz' | 'assignment' | 'browse'
 */
export function useActiveTimeTracker({ courseId = null, activityType = 'browse' } = {}) {
  const [activeSecondsSession, setActiveSecondsSession] = useState(0);
  const pendingSecondsRef = useRef(0);
  const lastActiveTimestampRef = useRef(Date.now());
  const isTabActiveRef = useRef(true);

  // Sync with backend
  const syncWithBackend = async (secondsToSync) => {
    if (secondsToSync < 5) return;
    try {
      await timeTrackingAPI.heartbeat({
        seconds: secondsToSync,
        courseId: courseId || null,
        activityType
      });
    } catch {
      // Silently catch network hiccups, avoid interrupting user flow
    }
  };

  useEffect(() => {
    // 1. User activity listener (resets idle timer)
    const onUserActivity = () => {
      lastActiveTimestampRef.current = Date.now();
    };

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(evt => window.addEventListener(evt, onUserActivity, { passive: true }));

    // 2. Visibility & Focus listeners
    const onVisibilityChange = () => {
      const isVisible = !document.hidden;
      isTabActiveRef.current = isVisible;
      if (isVisible) {
        lastActiveTimestampRef.current = Date.now();
      } else {
        // Tab hidden -> flush pending time
        if (pendingSecondsRef.current >= 5) {
          const toSync = pendingSecondsRef.current;
          pendingSecondsRef.current = 0;
          syncWithBackend(toSync);
        }
      }
    };

    const onWindowBlur = () => { isTabActiveRef.current = false; };
    const onWindowFocus = () => {
      isTabActiveRef.current = true;
      lastActiveTimestampRef.current = Date.now();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);
    window.addEventListener('focus', onWindowFocus);

    // 3. Interval ticker (runs every 1 second)
    const ticker = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActiveTimestampRef.current;
      const isUserEngaged = isTabActiveRef.current && timeSinceLastActivity < 60000; // engaged within last 60s

      if (isUserEngaged) {
        pendingSecondsRef.current += 1;
        setActiveSecondsSession(prev => prev + 1);

        // Sync to backend every 30 seconds
        if (pendingSecondsRef.current >= 30) {
          const toSync = pendingSecondsRef.current;
          pendingSecondsRef.current = 0;
          syncWithBackend(toSync);
        }
      }
    }, 1000);

    // 4. Cleanup on unmount
    return () => {
      clearInterval(ticker);
      activityEvents.forEach(evt => window.removeEventListener(evt, onUserActivity));
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
      window.removeEventListener('focus', onWindowFocus);

      // Flush remaining pending seconds
      if (pendingSecondsRef.current >= 5) {
        const toSync = pendingSecondsRef.current;
        pendingSecondsRef.current = 0;
        syncWithBackend(toSync);
      }
    };
  }, [courseId, activityType]);

  return { activeSecondsSession };
}

export default useActiveTimeTracker;
