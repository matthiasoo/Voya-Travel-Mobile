import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { GradientBackground } from "../../components/GradientBackground";
import { useState, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { ProviderUser } from "../../types/user";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DashboardScreen() {
    const [user, setUser] = useState<ProviderUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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
            <GradientBackground variant="full">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#00D4FF" />
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground variant="full">
            <View className="flex-1 items-center pt-12 px-4 gap-6">
                <Text className="text-3xl font-bold text-white mb-2">Dashboard</Text>

                {/* Stats Card Placeholder */}
                <View className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 w-full items-center mb-4">
                    <Text className="text-text-muted">Statistics and quick actions coming soon.</Text>
                </View>

                {/* Actions Grid */}
                <View className="flex-row flex-wrap justify-between w-full gap-4">
                    {user?.category === 'ACCOMMODATION' && (
                        <TouchableOpacity
                            onPress={() => router.push('/offer/create-property')}
                            className="bg-slate-800/80 p-4 rounded-xl border border-neon-primary/50 w-full items-center gap-2 active:bg-slate-800"
                        >
                            <View className="w-12 h-12 rounded-full bg-neon-primary/20 items-center justify-center">
                                <Ionicons name="add" size={24} color="#7F00FF" />
                            </View>
                            <Text className="text-white font-bold text-center">Add Property</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </GradientBackground>
    );
}
