import type { PokemonListResponse } from './schemas/pokemonList.schema';
import type { PokemonDetailResponse } from './schemas/pokemonDetail.schema';
import type { PokemonDetail, PokemonSummary, PokemonStat } from '../types/pokemon';
import { extractIdFromUrl, buildSpriteUrl, buildArtworkUrl } from '../utils/pokeUrl';

export function mapListResponseToSummaries(response: PokemonListResponse): PokemonSummary[] {
  return response.results.map((entry) => {
    const id = extractIdFromUrl(entry.url);
    return {
      id,
      name: entry.name,
      spriteUrl: buildSpriteUrl(id),
    };
  });
}

export function mapDetailToDomain(raw: PokemonDetailResponse): PokemonDetail {
  // front_default is null for a few pokemon (rare forms, gaps in pokeapi's
  // own data), so fall back to the github sprite url built from the id
  const spriteUrl = raw.sprites.front_default ?? buildSpriteUrl(raw.id);
  const artworkUrl = raw.sprites.other?.['official-artwork']?.front_default ?? buildArtworkUrl(raw.id);

  const stats: PokemonStat[] = raw.stats.map((s) => ({
    name: s.stat.name,
    baseValue: s.base_stat,
  }));

  return {
    id: raw.id,
    name: raw.name,
    heightDecimeters: raw.height,
    weightHectograms: raw.weight,
    spriteUrl,
    artworkUrl,
    types: raw.types.map((t) => t.type.name),
    stats,
    moves: raw.moves.map((m) => m.move.name),
    speciesUrl: raw.species.url,
  };
}
