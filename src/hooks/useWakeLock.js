import { useEffect } from 'react';

/**
 * Holds a screen wake lock while `active` is truthy (e.g. during a live
 * workout) and re-acquires it when the tab returns to the foreground.
 */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active) return;
    let wakeLock = null;

    const request = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.warn('[useWakeLock] Failed to acquire wake lock:', err?.name, err?.message);
        }
      }
    };

    const onVisibility = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') request();
    };

    request();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
        wakeLock = null;
      }
    };
  }, [active]);
}
