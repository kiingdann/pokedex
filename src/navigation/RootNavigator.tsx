import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { BattleGridScreen } from '../screens/BattleGridScreen';
import { PokemonDetailScreen } from '../screens/PokemonDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    // both screens build their own pixel-styled header (back button, title,
    // safe area handling), so the native header is turned off entirely
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#9dceff' } }}>
      <Stack.Screen name="BattleGrid" component={BattleGridScreen} />
      <Stack.Screen name="PokemonDetail" component={PokemonDetailScreen} />
    </Stack.Navigator>
  );
}
