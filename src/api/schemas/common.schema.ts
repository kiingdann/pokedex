import { z } from 'zod';

// the shape pokeapi uses everywhere to reference another resource
export const namedApiResourceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
});

export type NamedApiResource = z.infer<typeof namedApiResourceSchema>;
