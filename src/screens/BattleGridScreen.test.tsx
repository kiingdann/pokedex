import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { AppState } from 'react-native';
import { BattleGridScreen } from './BattleGridScreen';
import { storage } from '../storage/mmkv';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'BattleGrid'>;

const testSafeAreaMetrics: Metrics = {
  frame: { x: 0, y: 0, width: 375, height: 812 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

// the live-stats engine underneath this screen needs AppState to look
// 'active', otherwise its timer never starts (see useAppStateAwareInterval)
function setAppState(state: string) {
  Object.defineProperty(AppState, 'currentState', { value: state, configurable: true });
}

function detailBodyFor(id: number, name: string) {
  return {
    id,
    name,
    height: 4,
    weight: 60,
    base_experience: 1,
    order: id,
    is_default: true,
    sprites: { front_default: `https://example.com/${name}.png` },
    types: [],
    abilities: [],
    stats: [{ base_stat: 35, effort: 0, stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' } }],
    moves: [],
    species: { name, url: `https://pokeapi.co/api/v2/pokemon-species/${id}/` },
  };
}

function createHarness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SafeAreaProvider initialMetrics={testSafeAreaMetrics}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
  return { client, Wrapper };
}

beforeEach(() => {
  setAppState('active');
  storage.clearAll();
});

describe('BattleGridScreen', () => {
  it('shows the pokemon list once the first page loads', async () => {
    globalThis.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/pokemon?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              count: 2,
              next: null,
              previous: null,
              results: [
                { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
                { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' },
              ],
            }),
        });
      }
      // per-card detail fetch
      const id = url.includes('/pokemon/1') ? 1 : 4;
      const name = id === 1 ? 'bulbasaur' : 'charmander';
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(detailBodyFor(id, name)) });
    }) as unknown as typeof fetch;

    const { client, Wrapper } = createHarness();
    const { unmount } = await render(
      <Wrapper>
        <BattleGridScreen route={{ key: 'grid', name: 'BattleGrid' }} navigation={{} as Props['navigation']} />
      </Wrapper>,
    );

    expect(await screen.findByText('bulbasaur')).toBeTruthy();
    expect(await screen.findByText('charmander')).toBeTruthy();

    // useLiveStatsEngine keeps a real interval alive (AppState is 'active');
    // unmounting lets its cleanup clear it, otherwise the process never exits
    unmount();
    client.clear();
  });

  it('shows the error message when the list fetch fails', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network unreachable')) as unknown as typeof fetch;

    const { client, Wrapper } = createHarness();
    const { unmount } = await render(
      <Wrapper>
        <BattleGridScreen route={{ key: 'grid', name: 'BattleGrid' }} navigation={{} as Props['navigation']} />
      </Wrapper>,
    );

    expect(await screen.findByText('network unreachable')).toBeTruthy();

    unmount();
    client.clear();
  });

  it('navigates to the detail screen with the right params when a card is pressed', async () => {
    globalThis.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/pokemon?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              count: 1,
              next: null,
              previous: null,
              results: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }],
            }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(detailBodyFor(1, 'bulbasaur')) });
    }) as unknown as typeof fetch;

    const navigate = jest.fn();
    const { client, Wrapper } = createHarness();
    const { unmount } = await render(
      <Wrapper>
        <BattleGridScreen
          route={{ key: 'grid', name: 'BattleGrid' }}
          navigation={{ navigate } as unknown as Props['navigation']}
        />
      </Wrapper>,
    );

    const card = await screen.findByText('bulbasaur');
    fireEvent.press(card);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('PokemonDetail', { pokemonId: 1, pokemonName: 'bulbasaur' });
    });

    unmount();
    client.clear();
  });
});
