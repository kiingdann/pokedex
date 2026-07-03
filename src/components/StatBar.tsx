import { memo, useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface StatBarProps {
  label: string;
  value: number;
  maxValue?: number;
}

const DEFAULT_MAX_STAT = 255; // highest a pokeapi base stat ever gets
const BAR_WIDTH = 64;

// width is animated with reanimated (shared value), not plain react state,
// so the animation runs on the UI thread instead of the JS thread - matters
// once several cards are ticking their stats every 500ms at the same time
function StatBarComponent({ label, value, maxValue = DEFAULT_MAX_STAT }: StatBarProps) {
  const width = useSharedValue((value / maxValue) * BAR_WIDTH);

  useEffect(() => {
    width.value = withTiming((value / maxValue) * BAR_WIDTH, { duration: 400 });
  }, [value, maxValue, width]);

  const animatedStyle = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <View className="flex-row items-center gap-1">
      <Text className="w-9 text-[10px] font-medium text-gray-400">{label}</Text>
      <View className="h-1.5 overflow-hidden rounded-full bg-gray-800" style={{ width: BAR_WIDTH }}>
        <Animated.View className="h-1.5 rounded-full bg-emerald-400" style={animatedStyle} />
      </View>
      <Text className="w-6 text-right text-[10px] text-gray-300">{value}</Text>
    </View>
  );
}

export const StatBar = memo(StatBarComponent);
