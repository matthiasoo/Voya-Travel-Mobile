import { View, Text } from "react-native";

export default function DashboardScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Admin Dashboard</Text>
            <Text className="text-foreground">System overview.</Text>
        </View>
    );
}
