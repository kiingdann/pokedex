import { storage } from './mmkv';
import type { PokemonFullDetail } from '../types/pokemon';

function cacheKey(id: number): string {
  return `pokemon-detail-${id}`;
}

export function getCachedFullDetail(id: number): PokemonFullDetail | null {
  const raw = storage.getString(cacheKey(id));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as PokemonFullDetail;
  } catch {
    // corrupted entry, just treat it as a cache miss instead of crashing
    storage.remove(cacheKey(id));
    return null;
  }
}

export function setCachedFullDetail(id: number, detail: PokemonFullDetail): void {
  storage.set(cacheKey(id), JSON.stringify(detail));
}
