import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchPokemonDetail } from '../api/pokemonApi';
import type { AsyncState } from '../types/asyncState';
import type { PokemonDetail } from '../types/pokemon';

// one query per pokemon, cached by react-query. feeds both the base stats
// shown in the card and the seed for the zustand live-stats store
export function usePokemonDetailQuery(id: number): AsyncState<PokemonDetail> {
  const query = useQuery({
    queryKey: ['pokemon-detail', id],
    queryFn: () => fetchPokemonDetail(id),
    staleTime: Infinity, // a pokemon's base stats never change in the real api
  });

  return useMemo<AsyncState<PokemonDetail>>(() => {
    if (query.status === 'pending') return { status: 'loading' };
    if (query.status === 'error') return { status: 'error', message: query.error.message };
    return { status: 'success', data: query.data };
  }, [query.status, query.data, query.error]);
}
