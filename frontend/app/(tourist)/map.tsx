import { View, Text } from "react-native";
import { GradientBackground } from "../../components/GradientBackground";

export default function MapScreen() {
    return (
        <GradientBackground variant="full">
            <View className="flex-1 items-center justify-center pt-12">
                <Text className="text-3xl font-bold text-white mb-2">Map</Text>
                <View className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 w-11/12 items-center">
                    <Text className="text-text-muted">Interactive map coming soon.</Text>
                </View>
            </View>
        </GradientBackground>
    );
}
