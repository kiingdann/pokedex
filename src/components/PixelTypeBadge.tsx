import { View, Text } from 'react-native';

interface PixelTypeBadgeProps {
  type: string;
}

export function PixelTypeBadge({ type }: PixelTypeBadgeProps) {
  return (
    <View className="items-center justify-center border border-black px-1 pb-1 pt-1.5">
      <Text className="font-pixel text-[8px] uppercase text-pokedex-ink">{type}</Text>
    </View>
  );
}
