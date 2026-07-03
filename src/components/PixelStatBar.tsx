import { memo } from 'react';
import { View, Text } from 'react-native';

interface PixelStatBarProps {
  label: string;
  value: number;
}

const SEGMENT_COUNT = 10;
// most base stats top out well under 255 (that's an outlier like blissey's
// hp), using it as the scale would leave typical stats looking almost empty
const DISPLAY_MAX = 150;

function PixelStatBarComponent({ label, value }: PixelStatBarProps) {
  const filled = Math.min(SEGMENT_COUNT, Math.round((value / DISPLAY_MAX) * SEGMENT_COUNT));

  return (
    <View className="w-1/2 flex-row items-center gap-1 px-1">
      <Text className="w-6 font-dotgothic text-xs text-pokedex-statFilled">{label}</Text>
      <View className="h-2.5 flex-1 flex-row gap-px">
        {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
          <View
            key={index}
            className={`h-full flex-1 ${index < filled ? 'bg-pokedex-statFilled' : 'bg-pokedex-statEmpty'}`}
          />
        ))}
      </View>
      <Text className="w-6 text-right font-dotgothic text-xs text-pokedex-statFilled">{value}</Text>
    </View>
  );
}

export const PixelStatBar = memo(PixelStatBarComponent);
