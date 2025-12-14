import { View, Text } from "react-native";

export default function MyOffersScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">My Offers</Text>
            <Text className="text-foreground">List of offers (CRUD) will go here.</Text>
        </View>
    );
}
