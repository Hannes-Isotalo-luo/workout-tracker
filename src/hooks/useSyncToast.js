import { useEffect } from 'react';

/**
 * Surfaces a toast when cloud sync completes or fails.
 * @param {{ syncStatus: string, user: object, historyLength: number, showToast: Function }} args
 */
export function useSyncToast({ syncStatus, user, historyLength, showToast }) {
  useEffect(() => {
    if (syncStatus === 'synced' && user) {
      showToast(`Cloud sync complete! ${historyLength} sessions secured.`, 'success', 3500);
    } else if (syncStatus === 'error') {
      showToast('Cloud sync failed. Operating offline.', 'error', 4500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncStatus, user, historyLength]);
}
