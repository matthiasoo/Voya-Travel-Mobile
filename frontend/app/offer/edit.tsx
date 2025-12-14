import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function EditOfferScreen() {
    const { id } = useLocalSearchParams();
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Edit Offer</Text>
            <Text className="text-foreground">Edit ID: {id}</Text>
        </View>
    );
}
