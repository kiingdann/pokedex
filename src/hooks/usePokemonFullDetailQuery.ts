import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchPokemonFullDetail } from '../api/pokemonApi';
import { getCachedFullDetail, setCachedFullDetail } from '../storage/pokemonDetailCache';
import type { AsyncState } from '../types/asyncState';
import type { PokemonFullDetail } from '../types/pokemon';

// this is the actual offline mechanism: try the network first and write
// the result to mmkv (disk, survives app restarts). if the fetch fails for
// any reason (no connection, api down...) fall back to whatever we have
// on disk instead of failing outright. react-query's own cache only lives
// in memory for the current session, it can't do this on its own
async function fetchWithOfflineFallback(id: number): Promise<PokemonFullDetail> {
  try {
    const data = await fetchPokemonFullDetail(id);
    setCachedFullDetail(id, data);
    return data;
  } catch (err) {
    const cached = getCachedFullDetail(id);
    if (cached) return cached;
    throw err;
  }
}

export function usePokemonFullDetailQuery(id: number): AsyncState<PokemonFullDetail> {
  const query = useQuery({
    queryKey: ['pokemon-full-detail', id],
    queryFn: () => fetchWithOfflineFallback(id),
    staleTime: Infinity,
  });

  return useMemo<AsyncState<PokemonFullDetail>>(() => {
    if (query.status === 'pending') return { status: 'loading' };
    if (query.status === 'error') return { status: 'error', message: query.error.message };
    return { status: 'success', data: query.data };
  }, [query.status, query.data, query.error]);
}
