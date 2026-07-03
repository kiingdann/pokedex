import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePokemonDetailQuery } from './usePokemonDetailQuery';

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

// each test gets its own client and tears it down after, otherwise
// react-query's internal timers keep jest from exiting cleanly
function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

const validDetailResponse = {
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

describe('usePokemonDetailQuery', () => {
  it('goes through loading then success with mapped data', async () => {
    mockFetchOnce(validDetailResponse);
    const { Wrapper, client } = createWrapper();

    const { result, unmount } = await renderHook(() => usePokemonDetailQuery(25), { wrapper: Wrapper });

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    if (result.current.status !== 'success') throw new Error('should be success');
    expect(result.current.data.name).toBe('pikachu');

    unmount();
    client.clear();
  });

  it('goes to error state if zod validation fails', async () => {
    mockFetchOnce({ id: 'not-a-number' });
    const { Wrapper, client } = createWrapper();

    const { result, unmount } = await renderHook(() => usePokemonDetailQuery(25), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    unmount();
    client.clear();
  });
});
