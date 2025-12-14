import { View, Text } from "react-native";

export default function DashboardScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Provider Dashboard</Text>
            <Text className="text-foreground">Stats and quick actions.</Text>
        </View>
    );
}
