import { useCallback, useRef } from 'react';
import { View, Text, Image, FlatList, ActivityIndicator, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { usePokemonListQuery } from '../hooks/usePokemonListQuery';
import { useLiveStatsEngine } from '../hooks/useLiveStatsEngine';
import { PokemonCard } from '../components/PokemonCard';
import type { PokemonSummary } from '../types/pokemon';

type Props = NativeStackScreenProps<RootStackParamList, 'BattleGrid'>;

export function BattleGridScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
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

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const header = (
    <View
      className="w-full items-center justify-center border-b border-pokedex-border bg-pokedex-bg p-4"
      style={{ paddingTop: insets.top + 16 }}
    >
      <Image
        source={require('../../assets/pixel/pokedex-logo.png')}
        style={{ width: 99, height: 33 }}
        resizeMode="contain"
      />
    </View>
  );

  if (asyncState.status === 'idle' || asyncState.status === 'loading') {
    return (
      <View className="flex-1 bg-pokedex-bg">
        {header}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#002851" />
        </View>
      </View>
    );
  }

  if (asyncState.status === 'error') {
    return (
      <View className="flex-1 bg-pokedex-bg">
        {header}
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center font-outfit text-pokedex-ink">{asyncState.message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-pokedex-bg">
      {header}
      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 16, gap: 10 }}
        data={asyncState.data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        // no getItemLayout here on purpose: card height changes once a
        // card's detail finishes loading (badges + full stat grid appear),
        // so a fixed row height would drift and fight FlatList's own
        // measurements, causing visible scroll jumps
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        ListFooterComponent={
          isFetchingNextPage ? (
            <View className="py-4">
              <ActivityIndicator color="#002851" />
            </View>
          ) : null
        }
      />
    </View>
  );
}
