import { ScrollView, View, Text, Image, ActivityIndicator, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePokemonFullDetailQuery } from '../hooks/usePokemonFullDetailQuery';
import { PixelStatBar } from '../components/PixelStatBar';
import { PixelTypeBadge } from '../components/PixelTypeBadge';
import { EvolutionChainView } from '../components/EvolutionChainView';
import { statLabel } from '../utils/statLabels';

type Props = NativeStackScreenProps<RootStackParamList, 'PokemonDetail'>;

const MAX_MOVES_SHOWN = 20; // some pokemon know 100+ moves, keep the screen reasonable

// pokeapi gives height in decimeters and weight in hectograms. the design
// shows imperial units (feet/inches, lbs), matching how the games display it
function formatHeight(heightDecimeters: number): string {
  const totalInches = (heightDecimeters / 10) * 39.3701;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `HT ${feet}' ${String(inches).padStart(2, '0')}"`;
}

function formatWeight(weightHectograms: number): string {
  const pounds = (weightHectograms / 10) * 2.20462;
  return `WT ${pounds.toFixed(1)} lbs`;
}

export function PokemonDetailScreen({ route, navigation }: Props) {
  const { pokemonId, pokemonName } = route.params;
  const insets = useSafeAreaInsets();
  const detailState = usePokemonFullDetailQuery(pokemonId);

  const header = (
    <View
      className="w-full flex-row items-center border-b border-pokedex-border bg-pokedex-bg"
      style={{ paddingTop: insets.top }}
    >
      <Pressable onPress={() => navigation.goBack()} className="h-14 w-14 items-center justify-center">
        <Text className="text-2xl text-pokedex-ink">{'‹'}</Text>
      </Pressable>
      <Text className="flex-1 text-center font-pixel text-sm uppercase text-pokedex-ink">{pokemonName}</Text>
      <View className="h-14 w-14" />
    </View>
  );

  if (detailState.status === 'idle' || detailState.status === 'loading') {
    return (
      <View className="flex-1 bg-pokedex-bg">
        {header}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#002851" />
        </View>
      </View>
    );
  }

  if (detailState.status === 'error') {
    return (
      <View className="flex-1 bg-pokedex-bg">
        {header}
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-outfit text-pokedex-ink">{detailState.message}</Text>
        </View>
      </View>
    );
  }

  const pokemon = detailState.data;
  const shownMoves = pokemon.moves.slice(0, MAX_MOVES_SHOWN);
  const hiddenMovesCount = pokemon.moves.length - shownMoves.length;

  return (
    <View className="flex-1 bg-pokedex-bg">
      {header}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View>
          <Image source={{ uri: pokemon.artworkUrl }} style={{ width: 200, height: 200, alignSelf: 'center' }} resizeMode="contain" />
          <View className="flex-row items-end justify-between">
            <View className="gap-2">
              <Text className="font-pixel text-[10px] text-pokedex-ink">#{String(pokemon.id).padStart(3, '0')}</Text>
              <Text className="font-pixel text-sm uppercase text-pokedex-ink">{pokemon.name}</Text>
              <View className="flex-row gap-1">
                {pokemon.types.map((type) => (
                  <PixelTypeBadge key={type} type={type} />
                ))}
              </View>
            </View>
            <View className="items-end gap-2">
              <Text className="font-pixel text-[10px] text-pokedex-ink">{formatHeight(pokemon.heightDecimeters)}</Text>
              <Text className="font-pixel text-[10px] text-pokedex-ink">{formatWeight(pokemon.weightHectograms)}</Text>
            </View>
          </View>
        </View>

        {pokemon.description ? (
          <View className="border border-pokedex-ink/10 bg-pokedex-panel p-3">
            <Text className="font-outfit text-[15px] text-pokedex-ink">{pokemon.description}</Text>
          </View>
        ) : null}

        <View className="gap-1">
          <Text className="font-outfit-semibold text-xs uppercase text-pokedex-ink">Base stats</Text>
          <View className="flex-row flex-wrap bg-pokedex-statBg p-2 opacity-90">
            {pokemon.stats.map((stat) => (
              <PixelStatBar key={stat.name} label={statLabel(stat.name)} value={stat.baseValue} />
            ))}
          </View>
        </View>

        <View className="gap-1">
          <Text className="font-outfit-semibold text-xs uppercase text-pokedex-ink">Evolution</Text>
          <EvolutionChainView node={pokemon.evolution} />
        </View>

        <View className="gap-1">
          <Text className="font-outfit-semibold text-xs uppercase text-pokedex-ink">Moves</Text>
          <View className="flex-row flex-wrap gap-2 border border-pokedex-ink/10 bg-pokedex-panel p-3">
            {shownMoves.map((move) => (
              <View key={move} className="border border-black px-2 py-1">
                <Text className="font-outfit text-xs capitalize text-pokedex-ink">{move.replace(/-/g, ' ')}</Text>
              </View>
            ))}
          </View>
          {hiddenMovesCount > 0 && (
            <Text className="font-outfit text-xs text-pokedex-ink/60">+{hiddenMovesCount} more</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
