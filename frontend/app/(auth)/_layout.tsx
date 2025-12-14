import { Stack } from "expo-router";

export default function Layout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="choose-role" />
            <Stack.Screen name="provider-setup" />
            <Stack.Screen name="forgot-password" />
        </Stack>
    );
}