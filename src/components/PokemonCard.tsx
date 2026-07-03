import { memo, useEffect } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import type { PokemonSummary } from '../types/pokemon';
import { usePokemonDetailQuery } from '../hooks/usePokemonDetailQuery';
import { useLiveStatsStore } from '../store/liveStatsStore';
import { PixelStatBar } from './PixelStatBar';
import { PixelTypeBadge } from './PixelTypeBadge';
import { statLabel } from '../utils/statLabels';

interface PokemonCardProps {
  pokemon: PokemonSummary;
  onPress: (pokemon: PokemonSummary) => void;
}

function PokemonCardComponent({ pokemon, onPress }: PokemonCardProps) {
  const detailState = usePokemonDetailQuery(pokemon.id);
  const seed = useLiveStatsStore((state) => state.seed);

  // seed the store with the real base stats as soon as detail loads. seed()
  // is idempotent (see liveStatsStore), so it's fine if this effect fires
  // more than once while scrolling
  useEffect(() => {
    if (detailState.status === 'success') {
      seed(pokemon.id, detailState.data.stats);
    }
  }, [detailState, pokemon.id, seed]);

  // this is the selector doing all the optimization work: zustand only
  // re-renders this card when liveStats[pokemon.id] changes reference,
  // never when some OTHER pokemon in the list gets ticked
  const liveStats = useLiveStatsStore((state) => state.liveStats[pokemon.id]);

  return (
    <Pressable onPress={() => onPress(pokemon)} className="w-full border-2 border-pokedex-cardBorder bg-pokedex-card p-1">
      <View className="flex-row items-center gap-3 p-2">
        <View className="h-16 w-16 items-center justify-center border-2 border-pokedex-spriteBorder bg-pokedex-sprite">
          <Image source={{ uri: pokemon.spriteUrl }} className="h-14 w-14" resizeMode="contain" />
        </View>
        <View className="flex-1 gap-2">
          <Text className="font-pixel text-sm uppercase text-pokedex-ink">{pokemon.name}</Text>
          {detailState.status === 'success' && (
            <View className="flex-row gap-1">
              {detailState.data.types.map((type) => (
                <PixelTypeBadge key={type} type={type} />
              ))}
            </View>
          )}
        </View>
        <Text className="text-2xl font-bold text-pokedex-ink">{'›'}</Text>
      </View>

      {liveStats ? (
        <View className="flex-row flex-wrap bg-pokedex-statBg p-2 opacity-90">
          {liveStats.map((stat) => (
            <PixelStatBar key={stat.name} label={statLabel(stat.name)} value={stat.liveValue} />
          ))}
        </View>
      ) : (
        <View className="bg-pokedex-statBg p-2 opacity-90">
          <Text className="font-dotgothic text-xs text-pokedex-statFilled">
            {detailState.status === 'error' ? 'stats unavailable' : 'loading stats...'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// explicit comparator: only the pokemon id decides whether the card needs
// to re-render. onPress gets a new reference on every parent render (it's
// an inline function) but that never changes what the card looks like, so
// we ignore it here on purpose
export const PokemonCard = memo(
  PokemonCardComponent,
  (prevProps, nextProps) => prevProps.pokemon.id === nextProps.pokemon.id,
);
