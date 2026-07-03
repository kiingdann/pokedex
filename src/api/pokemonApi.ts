import { apiGet } from './client';
import { pokemonListResponseSchema } from './schemas/pokemonList.schema';
import { pokemonDetailSchema } from './schemas/pokemonDetail.schema';
import { mapListResponseToSummaries, mapDetailToDomain } from './mappers';
import type { PokemonDetail, PokemonSummary } from '../types/pokemon';

// every function here does the same 3 steps: fetch, validate with zod, map
// to a domain type. if validation fails we just let the zod error bubble up,
// react-query picks it up as an error state
export interface PokemonListPage {
  summaries: PokemonSummary[];
  nextOffset: number | null;
}

const DEFAULT_PAGE_SIZE = 20;

export async function fetchPokemonList(offset: number, limit = DEFAULT_PAGE_SIZE): Promise<PokemonListPage> {
  const raw = await apiGet(`/pokemon?limit=${limit}&offset=${offset}`);
  const parsed = pokemonListResponseSchema.parse(raw);

  return {
    summaries: mapListResponseToSummaries(parsed),
    nextOffset: parsed.next ? offset + limit : null,
  };
}

export async function fetchPokemonDetail(idOrName: number | string): Promise<PokemonDetail> {
  const raw = await apiGet(`/pokemon/${idOrName}`);
  const parsed = pokemonDetailSchema.parse(raw);
  return mapDetailToDomain(parsed);
}
