import { mapListResponseToSummaries, mapDetailToDomain } from './mappers';
import type { PokemonListResponse } from './schemas/pokemonList.schema';
import type { PokemonDetailResponse } from './schemas/pokemonDetail.schema';

describe('mapListResponseToSummaries', () => {
  it('extracts the id and builds the sprite from each entry url', () => {
    const response: PokemonListResponse = {
      count: 1302,
      next: 'https://pokeapi.co/api/v2/pokemon?offset=20&limit=20',
      previous: null,
      results: [
        { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
        { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
      ],
    };

    const summaries = mapListResponseToSummaries(response);

    expect(summaries).toEqual([
      { id: 1, name: 'bulbasaur', spriteUrl: expect.stringContaining('/pokemon/1.png') },
      { id: 25, name: 'pikachu', spriteUrl: expect.stringContaining('/pokemon/25.png') },
    ]);
  });
});

describe('mapDetailToDomain', () => {
  const baseRaw: PokemonDetailResponse = {
    id: 25,
    name: 'pikachu',
    height: 4,
    weight: 60,
    base_experience: 112,
    order: 35,
    is_default: true,
    sprites: {
      front_default: 'https://example.com/pikachu.png',
      other: {
        'official-artwork': { front_default: 'https://example.com/art.png' },
      },
    },
    types: [{ slot: 1, type: { name: 'electric', url: 'https://pokeapi.co/api/v2/type/13/' } }],
    abilities: [
      {
        ability: { name: 'static', url: 'https://pokeapi.co/api/v2/ability/9/' },
        is_hidden: false,
        slot: 1,
      },
    ],
    stats: [
      { base_stat: 35, effort: 0, stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' } },
      { base_stat: 55, effort: 0, stat: { name: 'attack', url: 'https://pokeapi.co/api/v2/stat/2/' } },
    ],
    moves: [{ move: { name: 'thunder-shock', url: 'https://pokeapi.co/api/v2/move/84/' } }],
    species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' },
  };

  it('maps every field to the domain type', () => {
    const result = mapDetailToDomain(baseRaw);

    expect(result).toEqual({
      id: 25,
      name: 'pikachu',
      heightDecimeters: 4,
      weightHectograms: 60,
      spriteUrl: 'https://example.com/pikachu.png',
      artworkUrl: 'https://example.com/art.png',
      types: ['electric'],
      stats: [
        { name: 'hp', baseValue: 35 },
        { name: 'attack', baseValue: 55 },
      ],
      moves: ['thunder-shock'],
      speciesUrl: 'https://pokeapi.co/api/v2/pokemon-species/25/',
    });
  });

  it('falls back to the github sprite when front_default is null', () => {
    const raw: PokemonDetailResponse = {
      ...baseRaw,
      sprites: { front_default: null, other: undefined },
    };

    const result = mapDetailToDomain(raw);

    expect(result.spriteUrl).toContain('/pokemon/25.png');
    expect(result.artworkUrl).toContain('/official-artwork/25.png');
  });
});
