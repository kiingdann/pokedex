import { z } from 'zod';
import { namedApiResourceSchema, type NamedApiResource } from './common.schema';

// GET /evolution-chain/{id} - the real response has way more fields for
// evolution conditions (item, gender, held_item, time_of_day...), we only
// keep what's needed to show "evolves at level X" or "evolves with [item]"
const evolutionDetailSchema = z.object({
  trigger: namedApiResourceSchema.nullable(),
  min_level: z.number().nullable(),
  item: namedApiResourceSchema.nullable(),
});

export type EvolutionDetail = z.infer<typeof evolutionDetailSchema>;

// the chain is recursive (a species can have more than one evolution), so
// zod can't infer the type on its own here - we declare it by hand and
// type z.lazy with z.ZodType<T> to break the circular reference
export interface EvolutionChainLink {
  species: NamedApiResource;
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionChainLink[];
}

const evolutionChainLinkSchema: z.ZodType<EvolutionChainLink> = z.lazy(() =>
  z.object({
    species: namedApiResourceSchema,
    evolution_details: z.array(evolutionDetailSchema),
    evolves_to: z.array(evolutionChainLinkSchema),
  })
);

export const evolutionChainResponseSchema = z.object({
  id: z.number(),
  chain: evolutionChainLinkSchema,
});

export type EvolutionChainResponse = z.infer<typeof evolutionChainResponseSchema>;
