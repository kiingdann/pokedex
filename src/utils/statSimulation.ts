import type { LiveStat, PokemonStat } from '../types/pokemon';

// this is the fake "real-time feed". every 500ms tick we nudge each visible
// stat a little, but we don't let it drift forever - otherwise after a
// couple minutes a stat that started at 35 could end up at -400 or 900
const MAX_STAT_VALUE = 255; // highest a real pokeapi base stat ever gets (blissey's hp)
const MIN_STAT_VALUE = 1;
const JITTER_RANGE = 6; // how much it can move per tick, picked by eye
const DRIFT_ALLOWANCE = JITTER_RANGE * 3; // how far it's allowed to stray from the base value

export function jitterStat(stat: LiveStat): LiveStat {
  const delta = Math.floor(Math.random() * (JITTER_RANGE * 2 + 1)) - JITTER_RANGE;
  const next = stat.liveValue + delta;

  const lowerBound = Math.max(MIN_STAT_VALUE, stat.baseValue - DRIFT_ALLOWANCE);
  const upperBound = Math.min(MAX_STAT_VALUE, stat.baseValue + DRIFT_ALLOWANCE);

  return {
    ...stat,
    liveValue: Math.min(upperBound, Math.max(lowerBound, next)),
  };
}

export function jitterStats(stats: LiveStat[]): LiveStat[] {
  return stats.map(jitterStat);
}

// starting point is the real api value, ticking takes over from there
export function toLiveStats(stats: PokemonStat[]): LiveStat[] {
  return stats.map((stat) => ({ ...stat, liveValue: stat.baseValue }));
}
