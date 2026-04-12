import {SplashScreen, Stack} from "expo-router";

import '@/global.css';
import {useFonts} from "expo-font";
import {useEffect} from "react";
import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { PostHogProvider } from 'posthog-react-native';

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file');
}

const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST;

if (!posthogKey) {
  console.warn('PostHog API key not found in environment variables. Analytics will be disabled.');
}

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
      if (fontsLoaded) {
        SplashScreen.hideAsync()
      }
  }, [fontsLoaded])

  const AppContent = (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      taskUrls={{
        signUp: '/(auth)/sign-up/task',
        signIn: '/(auth)/sign-in/task',
        default: '/'
      }}
    >
      {fontsLoaded ? <Stack screenOptions={{ headerShown: false }} /> : null}
    </ClerkProvider>
  );

  return posthogKey ? (
    <PostHogProvider
      apiKey={posthogKey}
      options={{ host: posthogHost }}
    >
      {AppContent}
    </PostHogProvider>
  ) : (
    AppContent
  );
}
