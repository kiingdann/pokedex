import { ScrollView, View, Text, Image, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePokemonFullDetailQuery } from '../hooks/usePokemonFullDetailQuery';
import { StatBar } from '../components/StatBar';
import { TypeBadge } from '../components/TypeBadge';
import { EvolutionChainView } from '../components/EvolutionChainView';
import { statLabel } from '../utils/statLabels';

type Props = NativeStackScreenProps<RootStackParamList, 'PokemonDetail'>;

const MAX_MOVES_SHOWN = 20; // some pokemon know 100+ moves, keep the screen reasonable

export function PokemonDetailScreen({ route }: Props) {
  const { pokemonId, pokemonName } = route.params;
  const detailState = usePokemonFullDetailQuery(pokemonId);

  if (detailState.status === 'idle' || detailState.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950">
        <ActivityIndicator color="#34d399" />
      </View>
    );
  }

  if (detailState.status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950 px-6">
        <Text className="text-center text-lg capitalize text-white">{pokemonName}</Text>
        <Text className="mt-2 text-center text-red-400">{detailState.message}</Text>
      </View>
    );
  }

  const pokemon = detailState.data;
  const shownMoves = pokemon.moves.slice(0, MAX_MOVES_SHOWN);
  const hiddenMovesCount = pokemon.moves.length - shownMoves.length;

  return (
    <ScrollView className="flex-1 bg-gray-950" contentContainerStyle={{ padding: 16 }}>
      <View className="items-center">
        <Image source={{ uri: pokemon.artworkUrl }} className="h-40 w-40" resizeMode="contain" />
        <Text className="mt-2 text-2xl font-bold capitalize text-white">{pokemon.name}</Text>
        <Text className="text-gray-500">#{String(pokemon.id).padStart(3, '0')}</Text>
        <View className="mt-2 flex-row gap-2">
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </View>
      </View>

      {pokemon.description ? (
        <Text className="mt-4 text-center text-sm text-gray-300">{pokemon.description}</Text>
      ) : null}

      <View className="mt-6 flex-row justify-center gap-8">
        <View className="items-center">
          <Text className="text-xs text-gray-500">HEIGHT</Text>
          <Text className="text-white">{(pokemon.heightDecimeters / 10).toFixed(1)} m</Text>
        </View>
        <View className="items-center">
          <Text className="text-xs text-gray-500">WEIGHT</Text>
          <Text className="text-white">{(pokemon.weightHectograms / 10).toFixed(1)} kg</Text>
        </View>
      </View>

      <Text className="mb-2 mt-6 text-sm font-semibold uppercase text-gray-400">Base stats</Text>
      <View className="gap-1">
        {pokemon.stats.map((stat) => (
          <StatBar key={stat.name} label={statLabel(stat.name)} value={stat.baseValue} />
        ))}
      </View>

      <Text className="mb-2 mt-6 text-sm font-semibold uppercase text-gray-400">Evolution</Text>
      <EvolutionChainView node={pokemon.evolution} />

      <Text className="mb-2 mt-6 text-sm font-semibold uppercase text-gray-400">Moves</Text>
      <View className="flex-row flex-wrap gap-2">
        {shownMoves.map((move) => (
          <View key={move} className="rounded-full bg-gray-800 px-3 py-1">
            <Text className="text-xs capitalize text-gray-300">{move.replace(/-/g, ' ')}</Text>
          </View>
        ))}
      </View>
      {hiddenMovesCount > 0 && <Text className="mt-2 text-xs text-gray-500">+{hiddenMovesCount} more</Text>}
    </ScrollView>
  );
}
