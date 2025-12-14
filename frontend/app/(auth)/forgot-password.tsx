import { View, Text, Button } from "react-native";

export default function ForgotPassword() {
    return (
        <View className="flex-1 gap-4 items-center justify-center bg-background">
            <Text className="text-2xl text-foreground font-bold">Forgot Password</Text>
            <Text className="text-foreground">Enter email to reset password.</Text>
            <Button title="Send Reset Link" onPress={() => { }} />
        </View>
    );
}
