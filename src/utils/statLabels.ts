import type { PokemonStatName } from '../types/pokemon';

const STAT_LABELS: Record<PokemonStatName, string> = {
  hp: 'HP',
  attack: 'ATK',
  defense: 'DEF',
  'special-attack': 'SATK',
  'special-defense': 'SDEF',
  speed: 'SPD',
};

export function statLabel(name: PokemonStatName): string {
  return STAT_LABELS[name];
}
