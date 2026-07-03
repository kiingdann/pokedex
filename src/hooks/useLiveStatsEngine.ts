import { useCallback } from 'react';
import { useAppStateAwareInterval } from './useAppStateAwareInterval';
import { useLiveStatsStore } from '../store/liveStatsStore';

const TICK_INTERVAL_MS = 500;

// drives the battle grid's fake real-time feed. one single global timer
// (not one per card, that would be a lot of timers running for nothing)
// that looks up which ids are visible right now and only updates those.
// getVisibleIds reads from a ref on the screen side (see
// onViewableItemsChanged), not react state, so scrolling doesn't
// re-render the whole screen
export function useLiveStatsEngine(getVisibleIds: () => number[]): void {
  const tick = useLiveStatsStore((state) => state.tick);

  const handleTick = useCallback(() => {
    tick(getVisibleIds());
  }, [tick, getVisibleIds]);

  useAppStateAwareInterval(handleTick, TICK_INTERVAL_MS);
}
