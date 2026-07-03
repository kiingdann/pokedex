import { View, Image, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// shown while fonts are loading, right after the native splash hands off.
// backgrounds match on purpose so there's no visible flash between the two
export function SplashScreenView() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-pokedex-bg" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-1 items-center justify-center gap-3 border-b border-pokedex-border p-4">
        <Image
          source={require('../../assets/pixel/splash-logo.png')}
          style={{ width: 253, height: 86 }}
          resizeMode="contain"
        />
        <Image source={require('../../assets/pixel/pokeball.png')} style={{ width: 62, height: 64 }} resizeMode="contain" />
      </View>
      <View className="items-center justify-center border-t border-pokedex-border px-4 py-6">
        <Text className="text-center font-outfit text-xs text-pokedex-ink">
          An app for Baobab technical evalulation by Dahaba.
        </Text>
      </View>
    </View>
  );
}
