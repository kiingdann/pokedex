import { extractIdFromUrl, buildSpriteUrl, buildArtworkUrl } from './pokeUrl';

describe('extractIdFromUrl', () => {
  it('extracts the id from a standard pokemon url', () => {
    expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25);
  });

  it('also works without the trailing slash', () => {
    expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/1')).toBe(1);
  });

  it('works for species and evolution-chain urls too', () => {
    expect(extractIdFromUrl('https://pokeapi.co/api/v2/pokemon-species/133/')).toBe(133);
    expect(extractIdFromUrl('https://pokeapi.co/api/v2/evolution-chain/10/')).toBe(10);
  });

  it('throws if the url has no numeric segment', () => {
    expect(() => extractIdFromUrl('https://pokeapi.co/api/v2/pokemon/')).toThrow();
  });
});

describe('buildSpriteUrl / buildArtworkUrl', () => {
  it('builds the right urls from an id', () => {
    expect(buildSpriteUrl(25)).toContain('/pokemon/25.png');
    expect(buildArtworkUrl(25)).toContain('/official-artwork/25.png');
  });
});
