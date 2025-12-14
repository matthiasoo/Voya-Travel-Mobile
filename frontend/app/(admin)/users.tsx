import { View, Text } from "react-native";

export default function UsersScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Users</Text>
            <Text className="text-foreground">User management list.</Text>
        </View>
    );
}
