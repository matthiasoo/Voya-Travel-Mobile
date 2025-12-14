import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const user = auth().currentUser;
            if (!user) {
                // Not logged in -> Go to Auth/Login
                router.replace('/(auth)/login');
            } else {
                // Logged in logic
                // TODO: Fetch user role from database (Firestore)
                // For now, default to (tourist) or let them choose if not set.
                // Assuming we redirect to tourist for now:
                router.replace('/(tourist)');
            }
        };

        // Small delay or check ensuring nav is ready
        setTimeout(checkUser, 100);
    }, []);

    return (
        <View className="flex-1 items-center justify-center bg-background">
            <ActivityIndicator size="large" color="#3B82F6" />
        </View>
    );
}