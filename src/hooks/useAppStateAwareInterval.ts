import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

// generic hook: runs a setInterval that pauses itself when the app goes to
// background and starts back up when it comes to foreground. this is what
// stops the timer from running (and draining battery) while the user is on
// a different app
export function useAppStateAwareInterval(callback: () => void, delayMs: number): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(() => callbackRef.current(), delayMs);
    };

    const stop = () => {
      if (intervalId === null) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    if (AppState.currentState === 'active') {
      start();
    }

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        start();
      } else {
        // 'background' or 'inactive', either way we stop the timer
        stop();
      }
    });

    return () => {
      stop();
      subscription.remove();
    };
  }, [delayMs]);
}
