import type { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePokemonListQuery } from './usePokemonListQuery';

// each test gets its own client and tears it down after, otherwise
// react-query's internal timers keep jest from exiting cleanly
function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, client };
}

function mockListPage(offset: number, hasNext: boolean) {
  return {
    count: 1302,
    next: hasNext ? `https://pokeapi.co/api/v2/pokemon?offset=${offset + 20}&limit=20` : null,
    previous: null,
    results: [{ name: `mon-${offset}`, url: `https://pokeapi.co/api/v2/pokemon/${offset + 1}/` }],
  };
}

describe('usePokemonListQuery', () => {
  it('flattens the first page into a success asyncState', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockListPage(0, true)),
    }) as unknown as typeof fetch;
    const { Wrapper, client } = createWrapper();

    const { result, unmount } = await renderHook(() => usePokemonListQuery(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.asyncState.status).toBe('success');
    });

    if (result.current.asyncState.status !== 'success') throw new Error('should be success');
    expect(result.current.asyncState.data).toHaveLength(1);
    expect(result.current.hasNextPage).toBe(true);

    unmount();
    client.clear();
  });

  it('hasNextPage is false on the last page', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockListPage(1280, false)),
    }) as unknown as typeof fetch;
    const { Wrapper, client } = createWrapper();

    const { result, unmount } = await renderHook(() => usePokemonListQuery(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.asyncState.status).toBe('success');
    });

    expect(result.current.hasNextPage).toBe(false);

    unmount();
    client.clear();
  });
});
