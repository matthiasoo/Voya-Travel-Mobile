import { Stack } from "expo-router";

export default function Layout() {
    return (
        <Stack>
            <Stack.Screen name="dashboard" options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="users" options={{ title: 'Users' }} />
            <Stack.Screen name="reports" options={{ title: 'Reports' }} />
        </Stack>
    );
}
