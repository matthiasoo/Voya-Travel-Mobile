import { View, Text } from "react-native";

export default function ChatListScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Messages</Text>
            <Text className="text-foreground">List of conversations.</Text>
        </View>
    );
}
