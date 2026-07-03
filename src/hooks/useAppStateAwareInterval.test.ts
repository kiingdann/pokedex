import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useAppStateAwareInterval } from './useAppStateAwareInterval';

// AppState.addEventListener never fires a real native event in tests, so
// we spy on it to grab the callback and trigger it by hand. currentState
// is a getter on RN's side, hence defineProperty to change it per test
function setAppState(state: string) {
  Object.defineProperty(AppState, 'currentState', {
    value: state,
    configurable: true,
  });
}

describe('useAppStateAwareInterval', () => {
  let listener: ((state: string) => void) | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    setAppState('active');
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, cb) => {
      listener = cb as (state: string) => void;
      return { remove: jest.fn() } as ReturnType<typeof AppState.addEventListener>;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    listener = undefined;
  });

  it('appelle le callback toutes les delayMs quand l app est active', async () => {
    const callback = jest.fn();
    await act(async () => {
      renderHook(() => useAppStateAwareInterval(callback, 500));
    });

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('coupe le timer des que l app part en arriere-plan', async () => {
    const callback = jest.fn();
    await act(async () => {
      renderHook(() => useAppStateAwareInterval(callback, 500));
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(2);

    await act(async () => {
      listener?.('background');
      jest.advanceTimersByTime(2000);
    });

    // still 2, nothing ran while in the background
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('relance le timer quand l app revient au premier plan', async () => {
    const callback = jest.fn();
    await act(async () => {
      renderHook(() => useAppStateAwareInterval(callback, 500));
    });

    await act(async () => {
      listener?.('background');
      jest.advanceTimersByTime(1000);
    });
    expect(callback).not.toHaveBeenCalled();

    await act(async () => {
      listener?.('active');
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });
});
