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

                {/* Quick Stats (Dummy Data) */}
                <View className="flex-row flex-wrap justify-between w-full gap-4 mb-2">
                    <View className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 w-full gap-1">
                        <View className="flex-row justify-between items-start">
                            <Ionicons name="calendar-outline" size={24} color="#00D4FF" />
                            <Text className="text-neon-primary text-xs font-bold">+12%</Text>
                        </View>
                        <Text className="text-slate-400 text-xs mt-1">Total Bookings</Text>
                        <Text className="text-white text-2xl font-bold">128</Text>
                    </View>

                    <View className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 w-full gap-1">
                        <View className="flex-row justify-between items-start">
                            <Ionicons name="cash-outline" size={24} color="#22C55E" />
                            <Text className="text-neon-primary text-xs font-bold">+8%</Text>
                        </View>
                        <Text className="text-slate-400 text-xs mt-1">Total Revenue</Text>
                        <Text className="text-white text-2xl font-bold">$12,450</Text>
                    </View>

                    <View className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 w-full gap-1">
                        <View className="flex-row justify-between items-start">
                            <Ionicons name="eye-outline" size={24} color="#F59E0B" />
                            <Text className="text-neon-primary text-xs font-bold">+24%</Text>
                        </View>
                        <Text className="text-slate-400 text-xs mt-1">Profile Views</Text>
                        <Text className="text-white text-2xl font-bold">3.2k</Text>
                    </View>

                    <View className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 w-full gap-1">
                        <View className="flex-row justify-between items-start">
                            <Ionicons name="star-outline" size={24} color="#FBBF24" />
                            <Text className="text-neon-primary text-xs font-bold">4.9</Text>
                        </View>
                        <Text className="text-slate-400 text-xs mt-1">Average Rating</Text>
                        <Text className="text-white text-2xl font-bold">4.8</Text>
                    </View>
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
