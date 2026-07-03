import { View, Text } from 'react-native';

interface TypeBadgeProps {
  type: string;
}

const TYPE_COLORS: Record<string, string> = {
  normal: '#a8a878',
  fire: '#f08030',
  water: '#6890f0',
  electric: '#f8d030',
  grass: '#78c850',
  ice: '#98d8d8',
  fighting: '#c03028',
  poison: '#a040a0',
  ground: '#e0c068',
  flying: '#a890f0',
  psychic: '#f85888',
  bug: '#a8b820',
  rock: '#b8a038',
  ghost: '#705898',
  dragon: '#7038f8',
  dark: '#705848',
  steel: '#b8b8d0',
  fairy: '#ee99ac',
};

const DEFAULT_COLOR = '#68a090';

export function TypeBadge({ type }: TypeBadgeProps) {
  const color = TYPE_COLORS[type] ?? DEFAULT_COLOR;

  return (
    <View className="rounded-full px-3 py-1" style={{ backgroundColor: color }}>
      <Text className="text-xs font-semibold uppercase text-white">{type}</Text>
    </View>
  );
}
