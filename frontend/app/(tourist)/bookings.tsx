import { View, Text } from "react-native";

export default function BookingsScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">My Bookings</Text>
            <Text className="text-foreground">Booking history will go here.</Text>
        </View>
    );
}
