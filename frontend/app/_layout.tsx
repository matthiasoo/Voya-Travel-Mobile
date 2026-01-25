import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import "./globals.css";
import { NotificationService } from "../services/notifications";

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

    // Notiifcation Listener
    useEffect(() => {
        let unsubscribe = () => { };

        const setupNotifications = async () => {
            if (!user) return;

            const hasPermission = await NotificationService.requestPermissions();
            if (!hasPermission) return;

            // Get user role to listen for correct events
            const userDoc = await firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            const role = userData?.role;

            if (role) {
                // Listen for bookings
                const bookingUnsub = NotificationService.listenForBookingUpdates(user.uid, role);
                // Listen for chats
                const chatUnsub = NotificationService.listenForChatUpdates(user.uid);

                unsubscribe = () => {
                    bookingUnsub();
                    chatUnsub();
                };
            }
        };

        if (user) {
            setupNotifications();
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

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
