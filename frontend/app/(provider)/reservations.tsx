import { View, Text } from "react-native";

export default function ReservationsScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Reservations</Text>
            <Text className="text-foreground">Manage incoming reservations.</Text>
        </View>
    );
}
