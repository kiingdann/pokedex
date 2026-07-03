import { fetchPokemonList, fetchPokemonDetail, fetchPokemonFullDetail } from './pokemonApi';

// mocking fetch directly instead of hitting the real api, faster and no
// internet dependency
function mockFetchOnce(body: unknown, ok = true, status = 200) {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch;
}

// fetchPokemonFullDetail makes 3 sequential calls, one response per call in order
function mockFetchSequence(...bodies: unknown[]) {
  const impl = jest.fn();
  for (const body of bodies) {
    impl.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(body) });
  }
  globalThis.fetch = impl as unknown as typeof fetch;
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

describe('fetchPokemonFullDetail', () => {
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
          evolution_details: [
            { trigger: { name: 'level-up', url: 'https://pokeapi.co/api/v2/evolution-trigger/1/' }, min_level: null, item: null },
          ],
          evolves_to: [],
        },
      ],
    },
  };

  it('combines detail, species and evolution chain into one object', async () => {
    mockFetchSequence(detailBody, speciesBody, evolutionChainBody);

    const result = await fetchPokemonFullDetail(25);

    expect(result.name).toBe('pikachu');
    expect(result.description).toBe('A mouse pokemon.');
    expect(result.evolution.speciesName).toBe('pichu');
    expect(result.evolution.evolvesTo[0]?.speciesName).toBe('pikachu');
  });

  it('rejects if the species response fails validation', async () => {
    mockFetchSequence(detailBody, { id: 25 });

    await expect(fetchPokemonFullDetail(25)).rejects.toThrow();
  });
});
