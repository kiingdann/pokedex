import { fetchPokemonList, fetchPokemonDetail } from './pokemonApi';

// mocking fetch directly instead of hitting the real api, faster and no
// internet dependency
function mockFetchOnce(body: unknown, ok = true, status = 200) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

describe('fetchPokemonList', () => {
  it('returns summaries and nextOffset when there is another page', async () => {
    mockFetchOnce({
      count: 1302,
      next: 'https://pokeapi.co/api/v2/pokemon?offset=20&limit=20',
      previous: null,
      results: [{ name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' }],
    });

    const page = await fetchPokemonList(0, 20);

    expect(page.summaries).toHaveLength(1);
    expect(page.nextOffset).toBe(20);
  });

  it('returns a null nextOffset on the last page', async () => {
    mockFetchOnce({
      count: 1302,
      next: null,
      previous: 'https://pokeapi.co/api/v2/pokemon?offset=1280&limit=20',
      results: [{ name: 'last-mon', url: 'https://pokeapi.co/api/v2/pokemon/1302/' }],
    });

    const page = await fetchPokemonList(1300, 20);

    expect(page.nextOffset).toBeNull();
  });

  it('rejects when the response fails zod validation', async () => {
    mockFetchOnce({ count: 'not-a-number', next: null, previous: null, results: [] });

    await expect(fetchPokemonList(0, 20)).rejects.toThrow();
  });

  it('rejects when the http status is not ok', async () => {
    mockFetchOnce({}, false, 500);

    await expect(fetchPokemonList(0, 20)).rejects.toThrow('500');
  });
});

describe('fetchPokemonDetail', () => {
  it('validates and maps a correct detail response', async () => {
    mockFetchOnce({
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
    });

    const detail = await fetchPokemonDetail(25);

    expect(detail.name).toBe('pikachu');
    expect(detail.stats).toEqual([{ name: 'hp', baseValue: 35 }]);
  });

  it('rejects when an unknown stat name shows up in the response', async () => {
    mockFetchOnce({
      id: 25,
      name: 'pikachu',
      height: 4,
      weight: 60,
      base_experience: 112,
      order: 35,
      is_default: true,
      sprites: { front_default: null },
      types: [],
      abilities: [],
      stats: [{ base_stat: 35, effort: 0, stat: { name: 'not-a-real-stat', url: 'x' } }],
      moves: [],
      species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' },
    });

    await expect(fetchPokemonDetail(25)).rejects.toThrow();
  });
});
