import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { ActivityIndicator, View } from "react-native";
import { ProviderUser } from "../../types/user";

export default function Layout() {
    const [user, setUser] = useState<ProviderUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = auth().currentUser;
        if (!currentUser) return;

        const unsubscribe = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    setUser(doc.data() as ProviderUser);
                }
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!user) {
        return <Redirect href="/(auth)/login" />;
    }

    const isVerified = user.role === 'PROVIDER' && user.verificationStatus === 'VERIFIED';

    return (
        <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#3B82F6', tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' } }}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
                    href: isVerified ? undefined : null,
                }}
            />
            <Tabs.Screen
                name="my-offers"
                options={{
                    title: 'Offers',
                    tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
                    href: isVerified ? undefined : null,
                }}
            />
            <Tabs.Screen
                name="reservations"
                options={{
                    title: 'Reservations',
                    tabBarIcon: ({ color }) => <Ionicons name="calendar-number" size={24} color={color} />,
                    href: isVerified ? undefined : null,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Ionicons name="business" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
