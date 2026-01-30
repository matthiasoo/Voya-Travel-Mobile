import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useState, useEffect, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GradientBackground } from "../../components/GradientBackground";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Image } from "expo-image";
import { ChatMessage, sendMessage } from "../../services/chat";
import { ReportModal } from "../../components/ReportModal";

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const currentUser = auth().currentUser;
    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatMetadata, setChatMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (!id || !currentUser) return;

        
        const chatUnsubscribe = firestore()
            .collection('chats')
            .doc(id as string)
            .onSnapshot(doc => {
                if (doc.exists()) {
                    const data = doc.data();
                    setChatMetadata(data);

                    
                    
                    if (data && currentUser) {
                        const otherId = currentUser.uid === data.clientId ? data.providerId : data.clientId;
                        if (otherId) {
                            firestore().collection('users').doc(otherId).get().then(uDoc => {
                                const exists = typeof uDoc.exists === 'function' ? uDoc.exists() : uDoc.exists;
                                if (exists) {
                                    setOtherUser(uDoc.data());
                                }
                            });
                        }
                    }
                }
            });

        
        const messagesUnsubscribe = firestore()
            .collection('chats')
            .doc(id as string)
            .collection('messages')
            .orderBy('createdAt', 'asc')
            .onSnapshot(querySnapshot => {
                const fetchedMessages: ChatMessage[] = [];
                querySnapshot.forEach(doc => {
                    fetchedMessages.push({
                        id: doc.id,
                        ...doc.data()
                    } as ChatMessage);
                });
                setMessages(fetchedMessages);
                setLoading(false);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }, error => {
                console.error("Error fetching messages:", error);
                setLoading(false);
            });

        return () => {
            chatUnsubscribe();
            messagesUnsubscribe();
        };
    }, [id]);


    const handleSend = async () => {
        if (!inputText.trim()) return;
        const text = inputText.trim();
        setInputText("");

        try {
            await sendMessage(id as string, text);
        } catch (error) {
            console.error("Error sending message:", error);
            
            
        }
    };

    const renderMessageItem = ({ item }: { item: ChatMessage }) => {
        const isMyMessage = item.senderId === currentUser?.uid;

        return (
            <View className={`my-1 w-full flex-row items-end ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                {}
                {!isMyMessage && (
                    <View className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center mr-2 mb-1 border border-slate-600">
                        {}
                        <Ionicons name="chatbubble-ellipses" size={16} color="#94A3B8" />
                    </View>
                )}

                <View className={`max-w-[75%] px-4 py-3 rounded-2xl ${isMyMessage
                    ? 'bg-neon-primary rounded-br-none'
                    : 'bg-slate-700 rounded-bl-none border border-slate-600'
                    }`}>
                    <Text className={`text-base leading-5 ${isMyMessage ? 'text-white' : 'text-slate-200'}`}>{item.text}</Text>
                    {}
                </View>

                {}
                {isMyMessage && (
                    <View className="w-8 h-8 rounded-full bg-neon-primary/20 items-center justify-center ml-2 mb-1 border border-neon-primary/50 overflow-hidden">
                        <Ionicons name="person" size={16} color="#00D4FF" />
                    </View>
                )}
            </View>
        );
    };

    if (loading && !chatMetadata) {
        return (
            <GradientBackground variant="full">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#00D4FF" />
                </View>
            </GradientBackground>
        );
    }

    
    let otherPersonName = "Chat";
    if (chatMetadata && currentUser) {
        if (currentUser.uid === chatMetadata.clientId) {
            otherPersonName = chatMetadata.providerName || "Provider";
        } else {
            otherPersonName = chatMetadata.clientName || "Client";
        }
    }

    return (
        <GradientBackground variant="full">
            <View className="flex-1">
                {}
                <View className="pt-12 pb-2 px-4">
                    <View className="bg-slate-800/90 border border-slate-700 rounded-2xl p-3 flex-row items-center shadow-lg">
                        <TouchableOpacity onPress={() => router.back()} className="mr-3 bg-slate-700/50 p-2 rounded-full">
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                const targetId = currentUser?.uid === chatMetadata.clientId ? chatMetadata.providerId : chatMetadata.clientId;
                                if (targetId) router.push({ pathname: '/users/[id]', params: { id: targetId } });
                            }}
                            className="flex-1"
                        >
                            <Text className="text-lg font-bold text-white" numberOfLines={1}>
                                {chatMetadata?.offerTitle || "Loading..."}
                            </Text>
                            <Text className="text-slate-400 text-xs mt-0.5">
                                {otherPersonName} <Ionicons name="chevron-forward" size={12} color="#94A3B8" />
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setReportModalVisible(true)}
                            className="bg-slate-700/50 p-2 rounded-full ml-3"
                        >
                            <Ionicons name="flag" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                {}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={item => item.id || Math.random().toString()} 
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20, flexGrow: 1 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    <View className="p-4 flex-row items-center gap-3 pt-2 pb-8">
                        <View className="flex-1 bg-slate-800 rounded-full border border-slate-600 px-4 py-2 flex-row items-center">
                            <TextInput
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Type a message..."
                                placeholderTextColor="#64748B"
                                className="text-white flex-1 min-h-[40px] max-h-[100px]"
                                multiline
                            />
                        </View>
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!inputText.trim()}
                            className={`w-12 h-12 rounded-full items-center justify-center ${inputText.trim() ? 'bg-neon-primary' : 'bg-slate-700'}`}
                        >
                            <Ionicons name="send" size={20} color={inputText.trim() ? "white" : "#94A3B8"} className="ml-1" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
            {chatMetadata && currentUser && (
                <ReportModal
                    visible={reportModalVisible}
                    onClose={() => setReportModalVisible(false)}
                    targetId={currentUser.uid === chatMetadata.clientId ? chatMetadata.providerId : chatMetadata.clientId}
                    targetType="USER"
                    targetName={otherUser?.fullName || otherPersonName}
                />
            )}
        </GradientBackground>
    );
}
