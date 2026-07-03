import { jitterStat, jitterStats, toLiveStats } from './statSimulation';
import type { LiveStat, PokemonStat } from '../types/pokemon';

describe('toLiveStats', () => {
  it('sets liveValue to the real base_stat from the api', () => {
    const base: PokemonStat[] = [
      { name: 'hp', baseValue: 35 },
      { name: 'attack', baseValue: 55 },
    ];
    const live = toLiveStats(base);
    expect(live).toEqual([
      { name: 'hp', baseValue: 35, liveValue: 35 },
      { name: 'attack', baseValue: 55, liveValue: 55 },
    ]);
  });
});

describe('jitterStat', () => {
  it('always stays within the global min/max bounds', () => {
    let stat: LiveStat = { name: 'hp', baseValue: 35, liveValue: 35 };
    for (let i = 0; i < 500; i += 1) {
      stat = jitterStat(stat);
      expect(stat.liveValue).toBeGreaterThanOrEqual(1);
      expect(stat.liveValue).toBeLessThanOrEqual(255);
    }
  });

  it('never strays too far from base_stat (no unbounded random walk)', () => {
    let stat: LiveStat = { name: 'speed', baseValue: 90, liveValue: 90 };
    for (let i = 0; i < 500; i += 1) {
      stat = jitterStat(stat);
      expect(Math.abs(stat.liveValue - stat.baseValue)).toBeLessThanOrEqual(18);
    }
  });

  it('keeps the name and base_stat unchanged', () => {
    const stat: LiveStat = { name: 'defense', baseValue: 40, liveValue: 40 };
    const next = jitterStat(stat);
    expect(next.name).toBe('defense');
    expect(next.baseValue).toBe(40);
  });
});

describe('jitterStats', () => {
  it('applies the jitter to every stat in the array', () => {
    const stats: LiveStat[] = [
      { name: 'hp', baseValue: 35, liveValue: 35 },
      { name: 'attack', baseValue: 55, liveValue: 55 },
    ];
    const next = jitterStats(stats);
    expect(next).toHaveLength(2);
    expect(next[0]?.name).toBe('hp');
    expect(next[1]?.name).toBe('attack');
  });
});
