import { useLiveStatsStore } from './liveStatsStore';
import type { PokemonStat } from '../types/pokemon';

beforeEach(() => {
  useLiveStatsStore.setState({ liveStats: {} });
});

describe('liveStatsStore.seed', () => {
  it('sets live stats from the base stats', () => {
    const baseStats: PokemonStat[] = [{ name: 'hp', baseValue: 35 }];
    useLiveStatsStore.getState().seed(25, baseStats);

    expect(useLiveStatsStore.getState().liveStats[25]).toEqual([
      { name: 'hp', baseValue: 35, liveValue: 35 },
    ]);
  });

  it('does not overwrite stats that are already seeded (avoids a visual jump on re-scroll)', () => {
    useLiveStatsStore.setState({
      liveStats: { 25: [{ name: 'hp', baseValue: 35, liveValue: 99 }] },
    });

    useLiveStatsStore.getState().seed(25, [{ name: 'hp', baseValue: 35 }]);

    expect(useLiveStatsStore.getState().liveStats[25]?.[0]?.liveValue).toBe(99);
  });
});

describe('liveStatsStore.tick', () => {
  it('only updates the active ids passed in', () => {
    useLiveStatsStore.setState({
      liveStats: {
        25: [{ name: 'hp', baseValue: 35, liveValue: 35 }],
        1: [{ name: 'hp', baseValue: 45, liveValue: 45 }],
      },
    });

    const pikachuBefore = useLiveStatsStore.getState().liveStats[1];
    useLiveStatsStore.getState().tick([25]); // only 25 is "visible"

    const state = useLiveStatsStore.getState();
    // the non-visible pokemon keeps the exact same reference, so cards
    // subscribed to it don't re-render
    expect(state.liveStats[1]).toBe(pikachuBefore);
  });

  it('silently ignores ids with no detail loaded yet (not seeded)', () => {
    expect(() => useLiveStatsStore.getState().tick([999])).not.toThrow();
    expect(useLiveStatsStore.getState().liveStats[999]).toBeUndefined();
  });
});
