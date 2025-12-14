import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import "./globals.css";

export default function RootLayout() {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const router = useRouter();
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_700Bold,
    });

    const segments = useSegments();

    const onAuthStateChange = (user: FirebaseAuthTypes.User | null) => {
        setUser(user);
        if (initializing) setInitializing(false);
    }

    useEffect(() => {
        const subscriber = auth().onAuthStateChanged(onAuthStateChange);
        return subscriber;
    }, []);

    useEffect(() => {
        if (initializing) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inPublicGroup = segments[0] === '(auth)' || !segments[0];

        // If user is not logged in and tries to access restricted areas
        if (!user && !inPublicGroup) {
            router.replace('/(auth)/login');
        }
    }, [user, initializing, segments]);

    if (initializing || !fontsLoaded) {
        return (
            <View className="flex-1 gap-2 items-center justify-center bg-background">
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tourist)" />
            <Stack.Screen name="(provider)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
        </Stack>
    );
}
