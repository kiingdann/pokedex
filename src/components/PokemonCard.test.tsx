import { Profiler } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PokemonCard } from './PokemonCard';
import { useLiveStatsStore } from '../store/liveStatsStore';
import type { PokemonSummary } from '../types/pokemon';

// the second test below is the important one: it checks that only the
// visible pokemon's card re-renders, not just that values show up right
function mockDetailFetch(id: number) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        id,
        name: `mon-${id}`,
        height: 4,
        weight: 60,
        base_experience: 1,
        order: 1,
        is_default: true,
        sprites: { front_default: 'https://example.com/x.png' },
        types: [],
        abilities: [],
        stats: [{ base_stat: 35, effort: 0, stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' } }],
        moves: [],
        species: { name: `mon-${id}`, url: 'https://pokeapi.co/api/v2/pokemon-species/1/' },
      }),
  }) as unknown as typeof fetch;
}

describe('PokemonCard', () => {
  beforeEach(() => {
    useLiveStatsStore.setState({ liveStats: {} });
  });

  it('shows the stats once the detail has loaded', async () => {
    mockDetailFetch(25);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const pokemon: PokemonSummary = { id: 25, name: 'pikachu', spriteUrl: 'https://example.com/p.png' };

    await render(
      <QueryClientProvider client={client}>
        <PokemonCard pokemon={pokemon} onPress={() => {}} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('pikachu')).toBeTruthy();
    expect(await screen.findByText('35')).toBeTruthy();

    client.clear();
  });

  it('does not re-render when a DIFFERENT pokemon gets a tick, only its own', async () => {
    mockDetailFetch(25);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const pokemon: PokemonSummary = { id: 25, name: 'pikachu', spriteUrl: 'https://example.com/p.png' };

    let renderCount = 0;
    await render(
      <QueryClientProvider client={client}>
        <Profiler
          id="card"
          onRender={() => {
            renderCount += 1;
          }}
        >
          <PokemonCard pokemon={pokemon} onPress={() => {}} />
        </Profiler>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('35')).toBeTruthy();
    });
    const countAfterLoad = renderCount;

    await act(async () => {
      useLiveStatsStore.getState().tick([999]); // a different pokemon, not 25
    });
    expect(renderCount).toBe(countAfterLoad);

    await act(async () => {
      useLiveStatsStore.getState().tick([25]);
    });
    expect(renderCount).toBeGreaterThan(countAfterLoad);

    client.clear();
  });
});
