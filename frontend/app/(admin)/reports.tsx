import { View, Text } from "react-native";

export default function ReportsScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Reports</Text>
            <Text className="text-foreground">Reports and moderation.</Text>
        </View>
    );
}
