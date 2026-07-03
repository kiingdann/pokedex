import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { BattleGridScreen } from '../screens/BattleGridScreen';
import { PokemonDetailScreen } from '../screens/PokemonDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#030712' },
        headerTintColor: '#fff',
        contentStyle: { backgroundColor: '#030712' },
      }}
    >
      <Stack.Screen name="BattleGrid" component={BattleGridScreen} options={{ title: 'Battle Grid' }} />
      <Stack.Screen
        name="PokemonDetail"
        component={PokemonDetailScreen}
        options={({ route }) => ({ title: route.params.pokemonName })}
      />
    </Stack.Navigator>
  );
}
