import { z } from 'zod';
import { namedApiResourceSchema } from './common.schema';

// GET /pokemon/{id|name} - the real pokeapi response is huge (game_indices,
// held_items, cries, forms...), we only validate what the app actually
// needs. zod ignores the rest automatically since we're not using .strict()
const pokemonSpriteOtherSchema = z.object({
  'official-artwork': z
    .object({
      front_default: z.string().url().nullable(),
    })
    .partial()
    .optional(),
  home: z
    .object({
      front_default: z.string().url().nullable(),
    })
    .partial()
    .optional(),
});

const pokemonSpritesSchema = z.object({
  front_default: z.string().url().nullable(),
  front_shiny: z.string().url().nullable().optional(),
  other: pokemonSpriteOtherSchema.optional(),
});

const pokemonTypeSlotSchema = z.object({
  slot: z.number(),
  type: namedApiResourceSchema,
});

const pokemonAbilitySlotSchema = z.object({
  ability: namedApiResourceSchema,
  is_hidden: z.boolean(),
  slot: z.number(),
});

// the 6 base stats have been fixed since forever in the games, so we
// validate them here as an enum instead of casting the string later in the
// mapper - if pokeapi ever sends an unexpected name we get a real zod
// error instead of a silent, wrong cast
export const POKEMON_STAT_NAMES = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const;

const pokemonStatNameSchema = z.enum(POKEMON_STAT_NAMES);
export type PokemonStatName = z.infer<typeof pokemonStatNameSchema>;

// base_stat is the real api value, this is the starting point for the
// screen 1 live simulation (see hooks/useLiveStatsEngine)
const pokemonStatSchema = z.object({
  base_stat: z.number(),
  effort: z.number(),
  stat: z.object({
    name: pokemonStatNameSchema,
    url: z.string().url(),
  }),
});

// only keeping the move name, version_group_details isn't used anywhere
const pokemonMoveSchema = z.object({
  move: namedApiResourceSchema,
});

export const pokemonDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  height: z.number(),
  weight: z.number(),
  base_experience: z.number().nullable(),
  order: z.number(),
  is_default: z.boolean(),
  sprites: pokemonSpritesSchema,
  types: z.array(pokemonTypeSlotSchema),
  abilities: z.array(pokemonAbilitySlotSchema),
  stats: z.array(pokemonStatSchema),
  moves: z.array(pokemonMoveSchema),
  species: namedApiResourceSchema,
});

export type PokemonDetailResponse = z.infer<typeof pokemonDetailSchema>;
