import { create } from 'zustand';
import type { LiveStat, PokemonStat } from '../types/pokemon';
import { toLiveStats, jitterStat } from '../utils/statSimulation';

interface LiveStatsState {
  liveStats: Record<number, LiveStat[]>;
  // called once when a pokemon's detail finishes loading, sets up its
  // live stats from the real base_stat values
  seed: (id: number, baseStats: PokemonStat[]) => void;
  // called every 500ms by the tick engine, only with ids that are
  // currently visible on screen (see hooks/useLiveStatsEngine)
  tick: (activeIds: number[]) => void;
}

// kept separate from react-query on purpose: react-query is the source of
// truth from the server (caching, refetching...), zustand is fast-moving
// local state that has nothing to do with the network. keeping them apart
// avoids the two fighting over the same data
export const useLiveStatsStore = create<LiveStatsState>((set, get) => ({
  liveStats: {},

  seed: (id, baseStats) => {
    // if we already seeded this pokemon (user scrolled back to it), keep
    // the current live value instead of resetting it, otherwise the
    // numbers visibly jump every time a card comes back on screen
    if (get().liveStats[id]) return;
    set((state) => ({
      liveStats: { ...state.liveStats, [id]: toLiveStats(baseStats) },
    }));
  },

  tick: (activeIds) => {
    set((state) => {
      const next = { ...state.liveStats };
      for (const id of activeIds) {
        const current = next[id];
        // detail hasn't loaded for this one yet, nothing to update
        if (!current) continue;
        next[id] = current.map(jitterStat);
      }
      return { liveStats: next };
    });
  },
}));
