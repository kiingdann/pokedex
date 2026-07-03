import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchPokemonList } from '../api/pokemonApi';
import type { AsyncState } from '../types/asyncState';
import type { PokemonSummary } from '../types/pokemon';

export const POKEMON_LIST_QUERY_KEY = ['pokemon-list'] as const;

interface UsePokemonListQueryResult {
  asyncState: AsyncState<PokemonSummary[]>;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

// flattens react-query's pages/pageParams shape into one plain list, so
// the screen just deals with an array + an asyncState
export function usePokemonListQuery(): UsePokemonListQueryResult {
  const query = useInfiniteQuery({
    queryKey: POKEMON_LIST_QUERY_KEY,
    queryFn: ({ pageParam }) => fetchPokemonList(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
  });

  const asyncState = useMemo<AsyncState<PokemonSummary[]>>(() => {
    if (query.status === 'pending') return { status: 'loading' };
    if (query.status === 'error') return { status: 'error', message: query.error.message };
    return {
      status: 'success',
      data: query.data.pages.flatMap((page) => page.summaries),
    };
  }, [query.status, query.data, query.error]);

  return {
    asyncState,
    fetchNextPage: () => {
      void query.fetchNextPage();
    },
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
