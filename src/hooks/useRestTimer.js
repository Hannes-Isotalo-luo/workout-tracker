import { useEffect, useRef } from 'react';
import { formatTime } from '../utils/formatters.js';

/**
 * Drives the rest-timer countdown and its completion alert.
 *
 * `restTimer.endTime` (an absolute epoch ms) is the single source of truth, so
 * the remaining time is recomputed every tick — the countdown stays correct
 * even after the tab is backgrounded. On reaching zero it plays a dual-tone
 * chime + haptic (honoring settings) and dispatches STOP_REST_TIMER.
 *
 * Also pre-warms an AudioContext on first user gesture (required by mobile
 * browsers) and reflects the countdown in the document title.
 *
 * @param {{ restTimer: object, settings: object, dispatch: Function }} args
 */
export function useRestTimer({ restTimer, settings, dispatch }) {
  const audioCtxRef = useRef(null);

  // Warm up the AudioContext on the first click/touch so the chime can play.
  useEffect(() => {
    const warmUp = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && !audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      } catch (e) {
        console.warn('[useRestTimer] Audio warmup error:', e);
      }
    };
    window.addEventListener('click', warmUp, { capture: true });
    window.addEventListener('touchstart', warmUp, { capture: true });
    return () => {
      window.removeEventListener('click', warmUp, { capture: true });
      window.removeEventListener('touchstart', warmUp, { capture: true });
    };
  }, []);

  const playAlert = () => {
    if (settings.silenceAll) return;
    try {
      if (settings.soundEnabled) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        let ctx = audioCtxRef.current;
        if (!ctx && AudioCtx) ctx = new AudioCtx();
        if (ctx) {
          if (ctx.state === 'suspended') ctx.resume();
          const now = ctx.currentTime;
          const tone = (freq, start, dur) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0.5, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(start);
            osc.stop(start + dur);
          };
          tone(587.33, now, 0.4); // D5
          tone(880, now + 0.4, 0.6); // A5
        }
      }
    } catch (e) {
      console.warn('[useRestTimer] Chime error:', e);
    }
    try {
      if (settings.hapticsEnabled && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } catch (e) {
      console.warn('[useRestTimer] Haptic error:', e);
    }
  };

  // Countdown loop, anchored to endTime so it survives backgrounding.
  useEffect(() => {
    if (!restTimer.isRunning || !restTimer.endTime) return;

    const check = () => {
      const remaining = Math.max(0, Math.round((restTimer.endTime - Date.now()) / 1000));
      if (remaining <= 0) {
        playAlert();
        dispatch({ type: 'STOP_REST_TIMER' });
      } else {
        dispatch({ type: 'TICK_REST_TIMER' });
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };

    document.addEventListener('visibilitychange', onVisibility);
    const interval = setInterval(check, 1000);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restTimer.isRunning, restTimer.endTime, settings]);

  // Reflect the countdown in the tab title.
  useEffect(() => {
    const base = 'Workout Tracker';
    document.title =
      restTimer.isRunning && restTimer.seconds > 0
        ? `⏱️ ${formatTime(restTimer.seconds)} | ${base}`
        : base;
    return () => {
      document.title = base;
    };
  }, [restTimer.seconds, restTimer.isRunning]);
}
