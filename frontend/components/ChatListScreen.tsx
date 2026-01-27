import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { GradientBackground } from "./GradientBackground";
import { Ionicons } from "@expo/vector-icons";
import auth from "@react-native-firebase/auth";
import { Chat, getUserChats } from "../services/chat";
import { useAccessibility } from "../contexts/AccessibilityContext";

interface ChatListScreenProps {
    showBackButton?: boolean;
}

export function ChatListScreen({ showBackButton = false }: ChatListScreenProps) {
    const router = useRouter();
    const currentUser = auth().currentUser;
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { isHighContrast } = useAccessibility();

    const loadChats = async () => {
        try {
            const data = await getUserChats();
            setChats(data);
        } catch (error) {
            console.error("Error loading chats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadChats();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadChats();
    };

    const renderChatItem = ({ item }: { item: Chat }) => {
        const isClient = currentUser?.uid === item.clientId;
        const otherPersonName = isClient ? item.providerName : item.clientName;
        const lastMessageTime = item.updatedAt?.toDate();

        return (
            <TouchableOpacity
                onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id } })}
                className={`rounded-xl p-4 mb-3 flex-row items-center shadow-sm border ${isHighContrast
                        ? 'bg-black border-2 border-white'
                        : 'bg-slate-800/90 border-slate-700'
                    }`}
            >
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-700'
                    }`}>
                    <Ionicons name={isClient ? "business" : "person"} size={24} color={isHighContrast ? "#FACC15" : "#94A3B8"} />
                </View>
                <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-white font-bold text-lg" numberOfLines={1}>
                            {item.offerTitle}
                        </Text>
                        {lastMessageTime && (
                            <Text className={`text-xs ${isHighContrast ? 'text-gray-500' : 'text-slate-500'}`}>
                                {lastMessageTime.toLocaleDateString()}
                            </Text>
                        )}
                    </View>
                    <Text className={`text-sm font-medium mb-1 ${isHighContrast ? 'text-yellow-400' : 'text-neon-primary'}`}>{otherPersonName}</Text>
                    <Text className={`text-sm ${isHighContrast ? 'text-gray-400' : 'text-slate-400'}`} numberOfLines={1}>
                        {item.lastMessage}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <GradientBackground variant="full">
            <View className="flex-1 px-4 pt-12 pb-4">
                <View className="flex-row items-center justify-between mb-6">
                    {showBackButton ? (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className={`w-10 h-10 rounded-full items-center justify-center ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-800/80'
                                }`}
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <View className="w-10" />
                    )}
                    <Text className="text-2xl font-bold text-white">Messages</Text>
                    <View className="w-10" />
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color={isHighContrast ? "#FACC15" : "#00D4FF"} />
                    </View>
                ) : (
                    <FlatList
                        data={chats}
                        renderItem={renderChatItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isHighContrast ? "#FACC15" : "#00D4FF"} />
                        }
                        ListEmptyComponent={
                            <View className="items-center justify-center mt-20">
                                <Ionicons name="chatbubbles-outline" size={64} color={isHighContrast ? "#6B7280" : "#475569"} />
                                <Text className={`mt-4 text-center text-lg ${isHighContrast ? 'text-gray-500' : 'text-slate-500'}`}>No active chats</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </GradientBackground>
    );
}

