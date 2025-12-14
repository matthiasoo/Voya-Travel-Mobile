import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const user = auth().currentUser;
            if (!user) {
                // Not logged in -> Go to Auth/Login
                router.replace('/(auth)/login');
            } else {
                // Logged in logic -> Check Role
                try {
                    const userDoc = await firestore().collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        if (userData?.role === 'PROVIDER') {
                            router.replace('/(provider)/profile');
                        } else if (userData?.role === 'ADMIN') {
                            router.replace('/(admin)/approvals');
                        } else {
                            router.replace('/(tourist)');
                        }
                    } else {
                        // User exists in Auth but not in Firestore? Setup needed.
                        router.replace('/(auth)/baseuser-setup');
                    }
                } catch (error) {
                    console.error("Error checking user role:", error);
                    // Fallback or stay on splash?
                    // router.replace('/(auth)/login');
                }
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