import { Text, View, ActivityIndicator } from "react-native";
import { GradientBackground } from "../../components/GradientBackground";
import { useState } from "react";
import auth from "@react-native-firebase/auth";
import { FirebaseError } from "@firebase/util";
import { useRouter } from "expo-router";
import { GradientButton } from "../../components/GradientButton";
import { GradientInput } from "../../components/GradientInput";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const signUp = async () => {
        setLoading(true);
        try {
            await auth().createUserWithEmailAndPassword(email, password);
            router.replace('/(auth)/baseuser-setup');
        } catch (e: any) {
            const err = e as FirebaseError;
            alert('Registration failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientBackground>
            <Text className="text-3xl text-primary font-bold text-center">Register</Text>
            <View className="gap-4 w-full max-w-md">
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
                <ActivityIndicator size="small" />
            ) : (
                <GradientButton onPress={signUp} title="Register" />
            )}
        </GradientBackground>
    );
}
