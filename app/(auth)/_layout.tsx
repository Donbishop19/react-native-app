import { Stack, Redirect } from "expo-router";
import { useAuth } from '@clerk/expo';
import '@/global.css';

export default function AuthLayout() {
    const { isSignedIn, isLoaded } = useAuth();

    // Wait for auth to load
    if (!isLoaded) {
        return null;
    }

    // If user is already signed in, redirect to home
    if (isSignedIn) {
        return <Redirect href="/(tabs)" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
