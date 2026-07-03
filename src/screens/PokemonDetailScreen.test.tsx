import { render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PokemonDetailScreen } from './PokemonDetailScreen';
import { storage } from '../storage/mmkv';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'PokemonDetail'>;

function makeRoute(pokemonId: number, pokemonName: string): Props['route'] {
  return { key: 'pokemon-detail-test', name: 'PokemonDetail', params: { pokemonId, pokemonName } };
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
  moves: [{ move: { name: 'thunder-shock', url: 'https://pokeapi.co/api/v2/move/84/' } }],
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
      { species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' }, evolution_details: [], evolves_to: [] },
    ],
  },
};

beforeEach(() => {
  storage.clearAll();
});

describe('PokemonDetailScreen', () => {
  it('shows types, stats and evolution once the data loads', async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(detailBody) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(speciesBody) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(evolutionChainBody) }) as unknown as typeof fetch;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await render(
      <QueryClientProvider client={client}>
        <PokemonDetailScreen route={makeRoute(25, 'pikachu')} navigation={{} as Props['navigation']} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('electric')).toBeTruthy();
    expect(await screen.findByText('A mouse pokemon.')).toBeTruthy();
    expect(await screen.findByText('pichu')).toBeTruthy();

    client.clear();
  });

  it('shows the error message when the fetch fails and nothing is cached', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network unreachable')) as unknown as typeof fetch;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await render(
      <QueryClientProvider client={client}>
        <PokemonDetailScreen route={makeRoute(25, 'pikachu')} navigation={{} as Props['navigation']} />
      </QueryClientProvider>,
    );

    await waitFor(async () => {
      expect(await screen.findByText('network unreachable')).toBeTruthy();
    });

    client.clear();
  });
});
