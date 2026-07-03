import { z } from 'zod';
import { namedApiResourceSchema } from './common.schema';

// GET /pokemon?limit=X&offset=Y - entries only have name+url, no id or
// sprite, see utils/pokeUrl.ts for how we get those
export const pokemonListResponseSchema = z.object({
  count: z.number(),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  results: z.array(namedApiResourceSchema),
});

export type PokemonListResponse = z.infer<typeof pokemonListResponseSchema>;
