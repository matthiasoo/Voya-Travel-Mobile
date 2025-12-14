import { Text, View, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState } from "react";
import auth from "@react-native-firebase/auth";
import { FirebaseError } from "@firebase/util";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from "../../components/GradientButton";
import { StrokeButton } from "../../components/StrokeButton";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const signIn = async () => {
        setLoading(true);
        try {
            await auth().signInWithEmailAndPassword(email, password);
            router.replace('/(tourist)');
        } catch (e: any) {
            const err = e as FirebaseError;
            alert('Login failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#060514ff', '#0a0925ff']}
            className="flex-1 items-center justify-center p-6"
        >
            <View className="w-full max-w-md gap-6">
                <View className="items-center">
                    <Text className="text-5xl font-extrabold text-neon-primary mb-2">Voya Travel</Text>
                    <Text className="text-text-muted text-lg">Your Journey Begins Here</Text>
                </View>

                <View className="gap-4 mb-4">
                    <TextInput
                        className="w-full p-4 rounded-xl bg-void-surface border border-neon-secondary/30 text-text-main placeholder:text-text-muted/50"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="E-mail"
                        placeholderTextColor="#8F90A6"
                    />
                    <TextInput
                        className="w-full p-4 rounded-xl bg-void-surface border border-neon-secondary/30 text-text-main placeholder:text-text-muted/50"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor="#8F90A6"
                        secureTextEntry
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#00D4FF" />
                ) : (
                    <View className="gap-4">
                        <GradientButton onPress={signIn} title="Log In" />

                        <StrokeButton
                            onPress={() => router.push('/(auth)/register')}
                            title="Create Account"
                        />
                    </View>
                )}
            </View>
        </LinearGradient>
    );
}
