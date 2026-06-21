import { useEffect, useRef } from 'react';

/**
 * Maps browser back/forward navigation onto the app's view/selection state and
 * pushes internal navigation into the history stack, so the hardware/browser
 * Back button behaves intuitively (and guards discarding an active workout).
 *
 * @param {object} ctx — current view/selection state + the relevant actions
 */
export function useBrowserHistory(ctx) {
  const { currentView, selectedProgram, selectedPhase, activeSession } = ctx;
  const { clearSelection, setView, selectProgram, selectPhase, cancelSession, stopRestTimer } = ctx;
  const fromPopstate = useRef(false);

  // Apply popped browser states back into app state.
  useEffect(() => {
    const handlePopState = (event) => {
      const popState = event.state;
      if (!popState) {
        fromPopstate.current = true;
        clearSelection();
        setView('select');
        return;
      }

      fromPopstate.current = true;

      if (currentView === 'workout' && popState.currentView !== 'workout') {
        const confirmDiscard = window.confirm(
          'You have an active workout in progress. Are you sure you want to discard it? All progress will be lost.'
        );
        if (!confirmDiscard) {
          const stateKey = `${currentView}-${selectedProgram || ''}-${selectedPhase || ''}`;
          window.history.pushState({ key: stateKey, currentView, selectedProgram, selectedPhase }, '');
          fromPopstate.current = false;
          return;
        }
        cancelSession();
        stopRestTimer();
      }

      if (popState.currentView === 'workout' && !activeSession) {
        setView('select');
        clearSelection();
        return;
      }

      if (popState.currentView) setView(popState.currentView);
      if (popState.selectedProgram === null) {
        clearSelection();
      } else {
        selectProgram(popState.selectedProgram);
        if (popState.selectedPhase) selectPhase(popState.selectedPhase);
      }
    };

    window.addEventListener('popstate', handlePopState);

    const initialKey = `${currentView}-${selectedProgram || ''}-${selectedPhase || ''}`;
    window.history.replaceState({ key: initialKey, currentView, selectedProgram, selectedPhase }, '');

    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, selectedProgram, selectedPhase, activeSession]);

  // Push internal navigation transitions into the history stack.
  useEffect(() => {
    if (fromPopstate.current) {
      fromPopstate.current = false;
      return;
    }
    const stateKey = `${currentView}-${selectedProgram || ''}-${selectedPhase || ''}`;
    if (window.history.state?.key !== stateKey) {
      window.history.pushState({ key: stateKey, currentView, selectedProgram, selectedPhase }, '');
    }
  }, [currentView, selectedProgram, selectedPhase]);
}
