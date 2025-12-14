import { Text, View, TextInput, Button, ActivityIndicator } from "react-native";
import { useState } from "react";
import auth from "@react-native-firebase/auth";
import { FirebaseError } from "@firebase/util";
import { useRouter } from "expo-router";

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const signUp = async () => {
        setLoading(true);
        try {
            await auth().createUserWithEmailAndPassword(email, password);
            router.replace('/(auth)/choose-role'); // Navigate to role selection after signup
        } catch (e: any) {
            const err = e as FirebaseError;
            alert('Register failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="p-2 text-3xl text-primary font-bold">Register</Text>
            <TextInput
                className="border w-[20rem] p-3 rounded-lg border-secondary text-foreground bg-slate-900/50"
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail"
                placeholderTextColor="#94a3b8"
            />
            <TextInput
                className="border w-[20rem] p-3 rounded-lg border-secondary text-foreground bg-slate-900/50"
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry
            />
            {loading ? (
                <ActivityIndicator size="small" />
            ) : (
                <Button onPress={signUp} title="Register" />
            )}
        </View>
    );
}
