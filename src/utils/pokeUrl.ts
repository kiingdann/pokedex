// the paginated list endpoint only gives us name + url, no id or sprite.
// but the id is always the last segment of the url, so we can build the
// sprite directly instead of fetching full detail for every item in the grid
export function extractIdFromUrl(url: string): number {
  const match = /\/(\d+)\/?$/.exec(url);
  if (!match || !match[1]) {
    throw new Error(`could not extract an id from url: ${url}`);
  }
  return Number(match[1]);
}

export function buildSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function buildArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}
