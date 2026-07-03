import { memo, useEffect } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import type { PokemonSummary } from '../types/pokemon';
import { usePokemonDetailQuery } from '../hooks/usePokemonDetailQuery';
import { useLiveStatsStore } from '../store/liveStatsStore';
import { StatBar } from './StatBar';
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
    <Pressable
      onPress={() => onPress(pokemon)}
      className="flex-row items-center gap-3 border-b border-gray-800 bg-gray-950 px-4 py-3"
    >
      <Image source={{ uri: pokemon.spriteUrl }} className="h-16 w-16" resizeMode="contain" />
      <View className="flex-1">
        <Text className="text-base font-semibold capitalize text-white">{pokemon.name}</Text>
        {liveStats ? (
          <View className="mt-1 flex-row flex-wrap gap-x-3 gap-y-1">
            {liveStats.map((stat) => (
              <StatBar key={stat.name} label={statLabel(stat.name)} value={stat.liveValue} />
            ))}
          </View>
        ) : (
          <Text className="mt-1 text-xs text-gray-500">
            {detailState.status === 'error' ? 'stats unavailable' : 'loading stats...'}
          </Text>
        )}
      </View>
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
