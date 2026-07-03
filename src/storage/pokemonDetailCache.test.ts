import { getCachedFullDetail, setCachedFullDetail } from './pokemonDetailCache';
import { storage } from './mmkv';
import type { PokemonFullDetail } from '../types/pokemon';

const samplePikachu: PokemonFullDetail = {
  id: 25,
  name: 'pikachu',
  heightDecimeters: 4,
  weightHectograms: 60,
  spriteUrl: 'https://example.com/p.png',
  artworkUrl: 'https://example.com/a.png',
  types: ['electric'],
  stats: [{ name: 'hp', baseValue: 35 }],
  moves: ['thunder-shock'],
  speciesUrl: 'https://pokeapi.co/api/v2/pokemon-species/25/',
  description: 'a mouse pokemon',
  evolution: { speciesId: 172, speciesName: 'pichu', minLevel: null, triggerName: null, evolvesTo: [] },
};

beforeEach(() => {
  storage.clearAll();
});

describe('pokemonDetailCache', () => {
  it('returns null when nothing is cached', () => {
    expect(getCachedFullDetail(25)).toBeNull();
  });

  it('round-trips a full detail object', () => {
    setCachedFullDetail(25, samplePikachu);
    expect(getCachedFullDetail(25)).toEqual(samplePikachu);
  });

  it('keeps different pokemon under separate keys', () => {
    setCachedFullDetail(25, samplePikachu);
    expect(getCachedFullDetail(1)).toBeNull();
  });

  it('treats corrupted json as a cache miss instead of throwing', () => {
    storage.set('pokemon-detail-25', 'not valid json{{{');
    expect(() => getCachedFullDetail(25)).not.toThrow();
    expect(getCachedFullDetail(25)).toBeNull();
  });
});
