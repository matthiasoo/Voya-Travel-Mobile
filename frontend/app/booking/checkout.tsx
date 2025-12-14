import { View, Text } from "react-native";

export default function CheckoutScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Checkout</Text>
            <Text className="text-foreground">Payment processing.</Text>
        </View>
    );
}
