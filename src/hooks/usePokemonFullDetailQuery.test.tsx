import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePokemonFullDetailQuery } from './usePokemonFullDetailQuery';
import { storage } from '../storage/mmkv';
import { setCachedFullDetail } from '../storage/pokemonDetailCache';
import type { PokemonFullDetail } from '../types/pokemon';

// each test gets its own client and tears it down after, otherwise
// react-query's internal timers keep jest from exiting cleanly
function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

const detailBody = {
  id: 25,
  name: 'pikachu',
  height: 4,
  weight: 60,
  base_experience: 112,
  order: 35,
  is_default: true,
  sprites: { front_default: 'https://example.com/pikachu.png' },
  types: [{ slot: 1, type: { name: 'electric', url: 'https://pokeapi.co/api/v2/type/13/' } }],
  abilities: [],
  stats: [{ base_stat: 35, effort: 0, stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' } }],
  moves: [],
  species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' },
};
const speciesBody = {
  id: 25,
  name: 'pikachu',
  evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/10/' },
  flavor_text_entries: [
    {
      flavor_text: 'A mouse pokemon.',
      language: { name: 'en', url: 'https://pokeapi.co/api/v2/language/9/' },
      version: { name: 'red', url: 'https://pokeapi.co/api/v2/version/1/' },
    },
  ],
};
const evolutionChainBody = {
  id: 10,
  chain: {
    species: { name: 'pichu', url: 'https://pokeapi.co/api/v2/pokemon-species/172/' },
    evolution_details: [],
    evolves_to: [
      {
        species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' },
        evolution_details: [],
        evolves_to: [],
      },
    ],
  },
};

const cachedFallback: PokemonFullDetail = {
  id: 25,
  name: 'pikachu',
  heightDecimeters: 4,
  weightHectograms: 60,
  spriteUrl: 'https://example.com/cached.png',
  artworkUrl: 'https://example.com/cached-art.png',
  types: ['electric'],
  stats: [{ name: 'hp', baseValue: 35 }],
  moves: [],
  speciesUrl: 'https://pokeapi.co/api/v2/pokemon-species/25/',
  description: 'from the offline cache',
  evolution: { speciesId: 172, speciesName: 'pichu', minLevel: null, triggerName: null, evolvesTo: [] },
};

beforeEach(() => {
  storage.clearAll();
});

describe('usePokemonFullDetailQuery', () => {
  it('fetches from the network and writes the result to the offline cache', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(detailBody) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(speciesBody) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(evolutionChainBody) }) as unknown as typeof fetch;
    const { Wrapper, client } = createWrapper();

    const { result, unmount } = await renderHook(() => usePokemonFullDetailQuery(25), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    if (result.current.status !== 'success') throw new Error('should be success');
    expect(result.current.data.name).toBe('pikachu');

    // the write-through cache should now have this pokemon on disk
    expect(storage.contains('pokemon-detail-25')).toBe(true);

    unmount();
    client.clear();
  });

  it('falls back to the cached version when the network fails', async () => {
    setCachedFullDetail(25, cachedFallback);
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network unreachable')) as unknown as typeof fetch;
    const { Wrapper, client } = createWrapper();

    const { result, unmount } = await renderHook(() => usePokemonFullDetailQuery(25), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    if (result.current.status !== 'success') throw new Error('should be success');
    expect(result.current.data.description).toBe('from the offline cache');

    unmount();
    client.clear();
  });

  it('surfaces an error when the network fails and nothing is cached', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network unreachable')) as unknown as typeof fetch;
    const { Wrapper, client } = createWrapper();

    const { result, unmount } = await renderHook(() => usePokemonFullDetailQuery(25), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    unmount();
    client.clear();
  });
});
