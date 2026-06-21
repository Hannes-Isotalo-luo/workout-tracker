import { useState, useEffect } from 'react';

/**
 * Live elapsed-seconds counter for the active session, derived from its
 * startedAt timestamp. Resets to 0 when there is no active session.
 */
export function useWorkoutDuration(activeSession) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!activeSession) {
      setDuration(0);
      return;
    }
    const start = new Date(activeSession.startedAt).getTime();
    const update = () => setDuration(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  return duration;
}
