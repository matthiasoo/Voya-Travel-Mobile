import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ChatRoomScreen() {
    const { id } = useLocalSearchParams();
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Chat Room</Text>
            <Text className="text-foreground">Room ID: {id}</Text>
        </View>
    );
}
