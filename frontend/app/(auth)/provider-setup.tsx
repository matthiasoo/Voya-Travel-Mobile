import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function ProviderSetup() {
    const router = useRouter();

    return (
        <View className="flex-1 gap-4 items-center justify-center bg-background">
            <Text className="text-2xl text-foreground font-bold">Provider Setup</Text>
            <Text className="text-foreground">Company details form will go here.</Text>
            <Button title="Complete Setup" onPress={() => router.replace('/(provider)/dashboard')} />
        </View>
    );
}
