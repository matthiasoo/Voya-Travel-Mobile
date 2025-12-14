import { View, Text } from "react-native";

export default function CreateOfferScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Create Offer</Text>
            <Text className="text-foreground">Form to add new offer.</Text>
        </View>
    );
}
