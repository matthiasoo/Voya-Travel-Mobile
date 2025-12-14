import { View, Text } from "react-native";

export default function MapScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Map</Text>
            <Text className="text-foreground">Map with offers will go here.</Text>
        </View>
    );
}
