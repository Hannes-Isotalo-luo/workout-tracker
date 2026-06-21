import { useEffect } from 'react';
import { parseProgramCSV } from '../utils/csvParser.js';

/**
 * Loads and parses the program CSV once on mount, dispatching the result into
 * the workout reducer. Keeps the CSV-loading concern out of the provider body.
 * @param {Function} dispatch — the workout reducer dispatch
 */
export function useProgramData(dispatch) {
  useEffect(() => {
    let isMounted = true;
    dispatch({ type: 'LOAD_PROGRAM_START' });
    parseProgramCSV()
      .then((data) => {
        if (isMounted) dispatch({ type: 'LOAD_PROGRAM_SUCCESS', payload: data });
      })
      .catch((err) => {
        console.error('[useProgramData] Failed to load CSV:', err);
        if (isMounted) dispatch({ type: 'LOAD_PROGRAM_ERROR', payload: err.message || String(err) });
      });
    return () => {
      isMounted = false;
    };
  }, [dispatch]);
}
