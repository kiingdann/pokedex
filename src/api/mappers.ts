import type { PokemonListResponse } from './schemas/pokemonList.schema';
import type { PokemonDetailResponse } from './schemas/pokemonDetail.schema';
import type { PokemonSpeciesResponse } from './schemas/pokemonSpecies.schema';
import type { EvolutionChainLink } from './schemas/evolutionChain.schema';
import type { PokemonDetail, PokemonSummary, PokemonStat, EvolutionNode } from '../types/pokemon';
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

// evolution_details on a link describes how to reach THAT species from its
// parent, so it maps directly onto the node's own minLevel/triggerName -
// the root has none, which is correct, nothing evolves into a base form
export function mapEvolutionChainToDomain(link: EvolutionChainLink): EvolutionNode {
  const [firstDetail] = link.evolution_details;
  return {
    speciesId: extractIdFromUrl(link.species.url),
    speciesName: link.species.name,
    minLevel: firstDetail?.min_level ?? null,
    triggerName: firstDetail?.trigger?.name ?? null,
    evolvesTo: link.evolves_to.map(mapEvolutionChainToDomain),
  };
}

// pokeapi flavor text is full of \n and \f used just for line wrapping in
// the games, not real line breaks, so we flatten it into one clean sentence
export function extractEnglishDescription(species: PokemonSpeciesResponse): string {
  const entry = species.flavor_text_entries.find((e) => e.language.name === 'en');
  if (!entry) return '';
  return entry.flavor_text.replace(/[\n\f\r]+/g, ' ').replace(/\s+/g, ' ').trim();
}
