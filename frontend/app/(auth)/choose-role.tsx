import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function ChooseRole() {
    const router = useRouter();

    return (
        <View className="flex-1 gap-4 items-center justify-center bg-background">
            <Text className="text-2xl text-foreground font-bold">Choose your role</Text>
            <Button title="I am a Tourist" onPress={() => router.replace('/(tourist)')} />
            <Button title="I am a Provider" onPress={() => router.push('/(auth)/provider-setup')} />
        </View>
    );
}
