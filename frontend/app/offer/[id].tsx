import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function OfferDetailScreen() {
    const { id } = useLocalSearchParams();
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Offer Details</Text>
            <Text className="text-foreground">Offer ID: {id}</Text>
        </View>
    );
}
