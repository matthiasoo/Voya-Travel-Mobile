import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { GradientBackground } from "../../components/GradientBackground";
import { GradientButton } from "../../components/GradientButton";
import { AdminUser } from "../../types/user";
import { Ionicons } from '@expo/vector-icons';

export default function AdminProfile() {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = auth().currentUser;
        if (!currentUser) return;

        const unsubscribe = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot((documentSnapshot) => {
                if (documentSnapshot.exists) {
                    setUser(documentSnapshot.data() as AdminUser);
                }
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const handleSignOut = async () => {
        try {
            await auth().signOut();
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

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
            <View className="flex-1 items-center gap-6 w-full pt-12">
                {/* Avatar Section */}
                <View className="items-center relative">
                    <View className="w-32 h-32 rounded-full overflow-hidden border-4 border-neon-accent bg-slate-800 items-center justify-center shadow-neon-accent shadow-lg">
                        <Ionicons name="shield-checkmark" size={64} color="#FF00FF" />
                    </View>
                </View>

                {/* Info Section */}
                <View className="items-center gap-3">
                    <Text className="text-3xl font-bold text-white text-center tracking-tight">
                        {user?.firstName} {user?.lastName}
                    </Text>
                    <Text className="text-text-muted text-lg font-medium">{user?.email}</Text>
                    <View className="px-4 py-1.5 bg-neon-accent/15 rounded-full border border-neon-accent/50 mt-1">
                        <Text className="text-neon-accent text-xs font-bold uppercase tracking-widest">
                            {user?.role}
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View className="w-full px-8 mt-10">
                    <TouchableOpacity onPress={handleSignOut} className="items-center p-2">
                        <Text className="text-red-400 font-bold">Log Out</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </GradientBackground>
    );
}
