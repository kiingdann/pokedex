import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useLiveStatsEngine } from './useLiveStatsEngine';
import { useLiveStatsStore } from '../store/liveStatsStore';

// AppState.currentState isn't 'active' by default in the test environment,
// and useAppStateAwareInterval (underneath this hook) only starts its timer
// when it is
function setAppState(state: string) {
  Object.defineProperty(AppState, 'currentState', { value: state, configurable: true });
}

beforeEach(() => {
  jest.useFakeTimers();
  setAppState('active');
  useLiveStatsStore.setState({
    liveStats: {
      25: [{ name: 'hp', baseValue: 35, liveValue: 35 }],
      1: [{ name: 'hp', baseValue: 45, liveValue: 45 }],
    },
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useLiveStatsEngine', () => {
  it('ticks only the ids returned by getVisibleIds, every 500ms', async () => {
    const getVisibleIds = jest.fn(() => [25]);

    await act(async () => {
      renderHook(() => useLiveStatsEngine(getVisibleIds));
    });

    const bulbasaurBefore = useLiveStatsStore.getState().liveStats[1];

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(getVisibleIds).toHaveBeenCalled();
    // 25 was visible, its live stats got a new reference from the tick
    expect(useLiveStatsStore.getState().liveStats[25]).not.toEqual([{ name: 'hp', baseValue: 35, liveValue: 35 }]);
    // 1 was not in getVisibleIds, so it's untouched (same reference)
    expect(useLiveStatsStore.getState().liveStats[1]).toBe(bulbasaurBefore);
  });

  it('re-reads getVisibleIds on every tick, not just once', async () => {
    let visible = [25];
    const getVisibleIds = jest.fn(() => visible);

    await act(async () => {
      renderHook(() => useLiveStatsEngine(getVisibleIds));
    });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    const pikachuAfterFirstTick = useLiveStatsStore.getState().liveStats[25];

    // pretend the user scrolled: pikachu (25) is no longer visible
    visible = [1];

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // 25 didn't get a second tick since it scrolled off screen
    expect(useLiveStatsStore.getState().liveStats[25]).toBe(pikachuAfterFirstTick);
    // 1 did, now that it's visible
    expect(useLiveStatsStore.getState().liveStats[1]).not.toEqual([{ name: 'hp', baseValue: 45, liveValue: 45 }]);
  });
});
