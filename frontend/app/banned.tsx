import { View, Text, TouchableOpacity, Linking, BackHandler } from "react-native";
import { Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GradientBackground } from "../components/GradientBackground";
import { useEffect } from "react";
import auth from "@react-native-firebase/auth";

export default function BannedScreen() {

    
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => backHandler.remove();
    }, []);

    const handleSupport = () => {
        Linking.openURL("mailto:support@voyatravel.com?subject=Appeal Ban");
    };

    const handleSignOut = async () => {
        await auth().signOut();
    };

    return (
        <GradientBackground variant="full">
            <View className="flex-1 items-center justify-center p-6 gap-6">
                <View className="w-24 h-24 rounded-full bg-red-500/20 items-center justify-center border border-red-500">
                    <Ionicons name="ban" size={48} color="#EF4444" />
                </View>

                <Text className="text-3xl font-bold text-white text-center">Account Suspended</Text>

                <Text className="text-slate-300 text-center text-lg">
                    Your account has been suspended due to violations of our Community Guidelines.
                </Text>

                <View className="bg-slate-800 p-4 rounded-xl border border-slate-700 w-full">
                    <Text className="text-slate-400 text-center mb-2">Common reasons include:</Text>
                    <View className="gap-2">
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="ellipse" size={6} color="#94A3B8" />
                            <Text className="text-slate-300">Spam or Misleading Content</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="ellipse" size={6} color="#94A3B8" />
                            <Text className="text-slate-300">Harassment or Hate Speech</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <Ionicons name="ellipse" size={6} color="#94A3B8" />
                            <Text className="text-slate-300">Fraudulent Activity</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSupport}
                    className="w-full bg-slate-700 p-4 rounded-xl items-center border border-slate-600"
                >
                    <Text className="text-white font-bold">Contact Support</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleSignOut}
                    className="w-full p-4 rounded-xl items-center border border-red-500/50"
                >
                    <Text className="text-red-400 font-bold">Sign Out</Text>
                </TouchableOpacity>
            </View>
        </GradientBackground>
    );
}
