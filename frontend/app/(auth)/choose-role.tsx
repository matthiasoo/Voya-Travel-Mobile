import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { GradientBackground } from "../../components/GradientBackground";
import { GradientButton } from "../../components/GradientButton";

export default function ChooseRole() {
    const router = useRouter();

    return (
        <GradientBackground>
            <View className="items-center w-full gap-8">
                <View className="items-center gap-2">
                    <Text className="text-4xl font-extrabold text-neon-primary text-center">Join Voya</Text>
                    <Text className="text-text-muted text-lg text-center">How will you use the app?</Text>
                </View>

                <View className="w-full gap-4">
                    <TouchableOpacity
                        className="bg-slate-800/80 p-6 rounded-2xl border border-neon-secondary/50 active:bg-slate-800"
                        onPress={() => router.replace('/(tourist)')}
                    >
                        <Text className="text-2xl font-bold text-neon-secondary text-center">I am a Tourist</Text>
                        <Text className="text-gray-400 text-center mt-2">Discover places, book tours, and enjoy your trip.</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className="bg-slate-800/80 p-6 rounded-2xl border border-neon-primary/50 active:bg-slate-800"
                        onPress={() => router.push('/(auth)/provider-setup')}
                    >
                        <Text className="text-2xl font-bold text-neon-primary text-center">I am a Provider</Text>
                        <Text className="text-gray-400 text-center mt-2">Offer services, manage bookings, and grow your business.</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => router.back()} className="mt-4">
                    <Text className="text-text-muted">Back to Login</Text>
                </TouchableOpacity>
            </View>
        </GradientBackground>
    );
}
