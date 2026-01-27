import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAccessibility } from "../../contexts/AccessibilityContext";

export default function Layout() {
    const { isHighContrast } = useAccessibility();

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: isHighContrast ? '#FACC15' : '#3B82F6',
            tabBarInactiveTintColor: isHighContrast ? '#9CA3AF' : '#64748B',
            tabBarStyle: {
                backgroundColor: isHighContrast ? '#000000' : '#0f172a',
                borderTopColor: isHighContrast ? '#FFFFFF' : '#1e293b',
                borderTopWidth: isHighContrast ? 2 : 1,
            }
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Search',
                    tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="map"
                options={{
                    title: 'Map',
                    tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: 'Bookings',
                    tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="chats"
                options={{
                    title: 'Messages',
                    tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}

