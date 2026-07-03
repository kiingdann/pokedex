import type { PokemonStatName } from '../api/schemas/pokemonDetail.schema';
export type { PokemonStatName };

export interface PokemonSummary {
  id: number;
  name: string;
  spriteUrl: string;
}

export interface PokemonStat {
  name: PokemonStatName;
  baseValue: number;
}

// keeps baseValue around so the UI can always fall back to the real value
export interface LiveStat extends PokemonStat {
  liveValue: number;
}

export interface LivePokemon {
  id: number;
  name: string;
  spriteUrl: string;
  stats: LiveStat[];
}

export interface PokemonDetail {
  id: number;
  name: string;
  heightDecimeters: number;
  weightHectograms: number;
  spriteUrl: string;
  artworkUrl: string;
  types: string[];
  stats: PokemonStat[];
  moves: string[];
  speciesUrl: string;
}

// tree, not a flat list, because some species branch into multiple
// evolutions (Eevee being the classic example)
export interface EvolutionNode {
  speciesName: string;
  speciesId: number;
  minLevel: number | null;
  triggerName: string | null;
  evolvesTo: EvolutionNode[];
}
