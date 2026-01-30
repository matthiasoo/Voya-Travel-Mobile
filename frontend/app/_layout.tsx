import { Stack, useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import "./globals.css";
import { NotificationService } from "../services/notifications";
import { AccessibilityProvider } from "../contexts/AccessibilityContext";

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
        let unsubscribe = () => { };

        const setupNotifications = async () => {
            if (!user) return;

            const hasPermission = await NotificationService.requestPermissions();
            if (!hasPermission) return;

            
            const userDoc = await firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.data();
            const role = userData?.role;

            if (role) {
                
                const bookingUnsub = NotificationService.listenForBookingUpdates(user.uid, role);
                
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
        if (!user) return;

        
        const unsubscribe = firestore()
            .collection('users')
            .doc(user.uid)
            .onSnapshot((doc) => {
                const exists = typeof doc.exists === 'function' ? doc.exists() : doc.exists;
                if (exists) {
                    const userData = doc.data();
                    if (userData?.status === 'BLOCKED') {
                        if (segments[0] !== 'banned') {
                            router.replace('/banned');
                        }
                    } else if (segments[0] === 'banned') {
                        router.replace('/');
                    }
                }
            });

        return () => unsubscribe();
    }, [user, segments]);

    useEffect(() => {
        if (initializing) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inPublicGroup = segments[0] === '(auth)' || !segments[0] || segments[0] === 'banned';

        
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
        <AccessibilityProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tourist)" />
                <Stack.Screen name="(provider)" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen name="banned" options={{ gestureEnabled: false }} />
                <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
            </Stack>
        </AccessibilityProvider>
    );
}

