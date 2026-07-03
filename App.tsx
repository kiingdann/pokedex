import './global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { DotGothic16_400Regular } from '@expo-google-fonts/dotgothic16';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold } from '@expo-google-fonts/outfit';
import { queryClient } from './src/api/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreenView } from './src/components/SplashScreenView';

// keep the native splash up until our own JS splash view is ready to take
// over, otherwise there's a blank white flash between the two
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    PressStart2P_400Regular,
    DotGothic16_400Regular,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
  });

  useEffect(() => {
    // the JS splash below renders instantly (local images, no network), so
    // it's safe to swap away from the native one as soon as we mount
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      {fontsLoaded ? (
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="dark" />
        </QueryClientProvider>
      ) : (
        <SplashScreenView />
      )}
    </SafeAreaProvider>
  );
}
