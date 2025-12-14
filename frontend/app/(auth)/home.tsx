import { View, Text, TouchableOpacity } from "react-native";
import auth from "@react-native-firebase/auth";
import { GradientBackground } from "../../components/GradientBackground";

const Page = () => {
    return (
        <GradientBackground>
            <View className="flex-1 items-center justify-center gap-6">
                <Text className="text-5xl font-extrabold text-neon-primary mb-2">Voya Travel</Text>
                <TouchableOpacity onPress={() => auth().signOut()} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <Text className="text-white font-bold">Log Out</Text>
                </TouchableOpacity>
            </View>
        </GradientBackground>
    );
};

export default Page;