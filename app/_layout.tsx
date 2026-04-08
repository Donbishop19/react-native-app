import {SplashScreen, Stack} from "expo-router";

import '@/global.css';
import {useFonts} from "expo-font";
import {useEffect} from "react";

export default function RootLayout() {
  const [ fontsLoaded ] = useFonts({
    'Sans-regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'Sans-medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'Sans-bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Sans-semibold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'Sans-extrabold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'Sans-light': require('../assets/fonts/PlusJakartaSans-Light.ttf')
  });

  useEffect(() => {
      if (!fontsLoaded) {
        SplashScreen.hideAsync()
      }
  }, [fontsLoaded])

  if (!fontsLoaded) return  null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
