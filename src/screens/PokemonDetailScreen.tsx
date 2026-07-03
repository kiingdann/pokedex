import { View, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PokemonDetail'>;

// TODO: full screen 2 (types, evolutions, moves, offline mmkv cache).
// for now just enough to check navigation from the grid passes the
// right params
export function PokemonDetailScreen({ route }: Props) {
  const { pokemonName } = route.params;

  return (
    <View className="flex-1 items-center justify-center bg-gray-950">
      <Text className="text-lg capitalize text-white">{pokemonName}</Text>
      <Text className="mt-2 text-sm text-gray-500">detail screen coming soon</Text>
    </View>
  );
}
