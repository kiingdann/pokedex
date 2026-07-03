import { z } from 'zod';
import { namedApiResourceSchema } from './common.schema';

// GET /pokemon-species/{id} - we only need this endpoint for the evolution
// chain url, the /pokemon detail doesn't have it directly
const flavorTextEntrySchema = z.object({
  flavor_text: z.string(),
  language: namedApiResourceSchema,
  version: namedApiResourceSchema,
});

export const pokemonSpeciesSchema = z.object({
  id: z.number(),
  name: z.string(),
  evolution_chain: z.object({ url: z.string().url() }),
  flavor_text_entries: z.array(flavorTextEntrySchema),
});

export type PokemonSpeciesResponse = z.infer<typeof pokemonSpeciesSchema>;
