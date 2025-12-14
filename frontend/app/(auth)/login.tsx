import { Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { FirebaseError } from "@firebase/util";
import { useRouter } from "expo-router";
import { GradientBackground } from "../../components/GradientBackground";
import { GradientButton } from "../../components/GradientButton";
import { GradientInput } from "../../components/GradientInput";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const signIn = async () => {
        setLoading(true);
        try {
            const { user } = await auth().signInWithEmailAndPassword(email, password);

            // Check role
            const userDoc = await firestore().collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (userData?.role === 'PROVIDER') {
                    router.replace('/(provider)/profile');
                } else if (userData?.role === 'ADMIN') {
                    router.replace('/(admin)/approvals');
                } else {
                    router.replace('/(tourist)');
                }
            } else {
                router.replace('/(tourist)');
            }
        } catch (e: any) {
            const err = e as FirebaseError;
            alert('Login failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientBackground>
            <View className="items-center">
                <Text className="text-5xl font-extrabold text-neon-primary mb-2">Voya Travel</Text>
                <Text className="text-text-muted text-lg">Your Journey Begins Here</Text>
            </View>

            <View className="gap-4">
                <GradientInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="E-mail"
                />
                <GradientInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#00D4FF" />
            ) : (
                <View className="gap-4">
                    <GradientButton onPress={signIn} title="Log In" />

                    <TouchableOpacity
                        onPress={() => router.push('/(auth)/register')}
                        className="p-2 items-center"
                    >
                        <Text className="text-neon-secondary font-bold text-lg">Create Account</Text>
                    </TouchableOpacity>
                </View>
            )}
        </GradientBackground>
    );
}
