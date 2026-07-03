import { pokemonDetailSchema } from './pokemonDetail.schema';

const validPokemon = {
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
    {
      base_stat: 35,
      effort: 0,
      stat: { name: 'hp', url: 'https://pokeapi.co/api/v2/stat/1/' },
    },
  ],
  moves: [{ move: { name: 'thunder-shock', url: 'https://pokeapi.co/api/v2/move/84/' } }],
  species: { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon-species/25/' },
};

describe('pokemonDetailSchema', () => {
  it('validates a correct pokemon response', () => {
    const result = pokemonDetailSchema.safeParse(validPokemon);
    expect(result.success).toBe(true);
  });

  it('rejects a response missing a required field', () => {
    const { id, ...broken } = validPokemon;
    const result = pokemonDetailSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });

  it('rejects a stat whose base_stat is not a number', () => {
    const broken = {
      ...validPokemon,
      stats: [{ base_stat: 'thirty-five', effort: 0, stat: validPokemon.stats[0]?.stat }],
    };
    const result = pokemonDetailSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });
});
