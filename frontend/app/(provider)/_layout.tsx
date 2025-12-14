import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {
    return (
        <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#3B82F6' }}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="my-offers"
                options={{
                    title: 'Offers',
                    tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="reservations"
                options={{
                    title: 'Reservations',
                    tabBarIcon: ({ color }) => <Ionicons name="calendar-number" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Ionicons name="business" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
