// passing both id and name: id to fetch, name so the header has a title
// right away instead of flashing blank while the detail loads
export type RootStackParamList = {
  BattleGrid: undefined;
  PokemonDetail: { pokemonId: number; pokemonName: string };
};
