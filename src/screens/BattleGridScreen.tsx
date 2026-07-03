import { useCallback, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, type ViewToken } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePokemonListQuery } from '../hooks/usePokemonListQuery';
import { useLiveStatsEngine } from '../hooks/useLiveStatsEngine';
import { PokemonCard } from '../components/PokemonCard';
import type { PokemonSummary } from '../types/pokemon';

type Props = NativeStackScreenProps<RootStackParamList, 'BattleGrid'>;

// fixed row height, known ahead of time - lets us give getItemLayout to
// the FlatList so it skips measuring every item, which speeds up scrolling
// a lot on a big list
const ROW_HEIGHT = 96;

export function BattleGridScreen({ navigation }: Props) {
  const { asyncState, fetchNextPage, hasNextPage, isFetchingNextPage } = usePokemonListQuery();

  // visible ids on screen, kept in a ref instead of state. scrolling fires
  // onViewableItemsChanged a lot, so state would re-render the whole screen
  // every frame. only the tick engine (every 500ms) reads this value
  const visibleIdsRef = useRef<number[]>([]);
  useLiveStatsEngine(useCallback(() => visibleIdsRef.current, []));

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<PokemonSummary>[] }) => {
      visibleIdsRef.current = viewableItems.map((token) => token.item.id);
    },
  ).current;

  // 60% threshold: a card has to be mostly on screen to count as "active"
  // and receive ticks
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const handlePress = useCallback(
    (pokemon: PokemonSummary) => {
      navigation.navigate('PokemonDetail', { pokemonId: pokemon.id, pokemonName: pokemon.name });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: PokemonSummary }) => <PokemonCard pokemon={item} onPress={handlePress} />,
    [handlePress],
  );

  const keyExtractor = useCallback((item: PokemonSummary) => String(item.id), []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<PokemonSummary> | null | undefined, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (asyncState.status === 'idle' || asyncState.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950">
        <ActivityIndicator color="#34d399" />
      </View>
    );
  }

  if (asyncState.status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-gray-950 px-6">
        <Text className="text-center text-red-400">{asyncState.message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-gray-950"
      data={asyncState.data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      onViewableItemsChanged={handleViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      // standard tuning to keep scrolling smooth on a long list: only
      // mount what's needed around the visible window, unmount the rest
      initialNumToRender={12}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
      ListFooterComponent={
        isFetchingNextPage ? (
          <View className="py-4">
            <ActivityIndicator color="#34d399" />
          </View>
        ) : null
      }
    />
  );
}
