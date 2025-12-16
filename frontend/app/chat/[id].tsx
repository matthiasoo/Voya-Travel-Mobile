import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { GradientBackground } from "../../components/GradientBackground";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Image } from "expo-image";

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const currentUser = auth().currentUser;
    const [inputText, setInputText] = useState("");
    const [user, setUser] = useState<any>(null); // Using 'any' for simplicity as in profile.tsx usage context, or could import TouristUser

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot((documentSnapshot) => {
                if (documentSnapshot.exists) {
                    setUser(documentSnapshot.data());
                }
            }, (error) => {
                console.error("Error fetching user data: ", error);
            });

        return () => unsubscribe();
    }, []);

    // Dummy Data
    const [messages, setMessages] = useState([
        { id: '1', text: "Hello! I have a question about your hotel.", sender: 'me' },
        { id: '2', text: "Salaam alaikum!", sender: 'them' },
        { id: '3', text: "Sorry, I don't understand.", sender: 'me' },
        { id: '4', text: "Alhamdulillah", sender: 'them' },
    ]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        setMessages(prev => [...prev, { id: Date.now().toString(), text: inputText, sender: 'me' }]);
        setInputText("");
    };

    const renderMessageItem = ({ item }: { item: { id: string, text: string, sender: string } }) => {
        const isMyMessage = item.sender === 'me';
        return (
            <View className={`my-1 w-full flex-row items-end ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                {/* Provider Avatar (Them) */}
                {!isMyMessage && (
                    <View className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center mr-2 mb-1 border border-slate-600">
                        <Ionicons name="business" size={16} color="#94A3B8" />
                    </View>
                )}

                <View className={`max-w-[70%] px-4 py-4 my-3 rounded-2xl ${isMyMessage ? 'bg-neon-primary rounded-br-none' : 'bg-slate-700 rounded-bl-none'
                    }`}>
                    <Text className="text-white text-base leading-5">{item.text}</Text>
                </View>

                {/* User Avatar (Me) */}
                {isMyMessage && (
                    <View className="w-8 h-8 rounded-full bg-neon-primary/20 items-center justify-center ml-2 mb-1 border border-neon-primary/50 overflow-hidden">
                        {user?.avatarUrl ? (
                            <Image source={{ uri: user.avatarUrl }} style={{ width: 32, height: 32 }} contentFit="cover" />
                        ) : (
                            <Ionicons name="person" size={16} color="#00D4FF" />
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <GradientBackground variant="full">
            <View className="flex-1">
                {/* Header */}
                <View className="pt-12 pb-2 px-4">
                    <View className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex-row items-center shadow-lg">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4 bg-slate-700/50 p-2 rounded-full">
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text className="text-lg font-bold text-white">Jumeirah Burj Al Arab</Text>
                            <Text className="text-slate-400 text-xs mt-0.5">Muhammad Ali</Text>
                        </View>
                    </View>
                </View>

                {/* Messages */}
                <FlatList
                    data={messages}
                    renderItem={renderMessageItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 50, flexGrow: 1, justifyContent: 'flex-end' }}
                    className="flex-1"
                />

                {/* Input */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
                >
                    <View className="p-4 flex-row items-center gap-3 pt-2 pb-8 bg-slate-900/50">
                        <View className="flex-1 bg-slate-800 rounded-full border border-slate-600 px-4 py-2 flex-row items-center">
                            <TextInput
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Type a message..."
                                placeholderTextColor="#64748B"
                                className="text-white flex-1 min-h-[40px]"
                                multiline
                            />
                        </View>
                        <TouchableOpacity
                            onPress={handleSend}
                            className={`w-12 h-12 rounded-full items-center justify-center ${inputText.trim() ? 'bg-neon-primary' : 'bg-slate-700'}`}
                        >
                            <Ionicons name="send" size={20} color={inputText.trim() ? "white" : "#94A3B8"} className="ml-1" />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </GradientBackground>
    );
}
