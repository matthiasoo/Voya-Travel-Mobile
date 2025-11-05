import { Text, View, TextInput, Button, ActivityIndicator } from "react-native";
import { useState } from "react";
import auth from "@react-native-firebase/auth";
import { FirebaseError } from "@firebase/util";

export default function Index() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const signUp = async () => {
        setLoading(true);
        try {
            await auth().createUserWithEmailAndPassword(email, password);
        } catch (e: any) {
            const err = e as FirebaseError;
            alert('Błąd rejestracji: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    const signIn = () => {

    }

    return (
        <View className="flex-1 gap-10 items-center justify-center">
            <Text className="p-2 text-5xl">Voya Travel</Text>
            <TextInput
                className="border w-[20rem]"
                value={email}
                onChangeText={setEmail}
                placeholder="E-mail"
            />
            <TextInput
                className="border w-[20rem]"
                value={password}
                onChangeText={setPassword}
                placeholder="Hasło"
            />
            {loading ? (
                <ActivityIndicator size="small" />
            ) : (
                <Button onPress={signUp} title="Sign Up" />
            )}
        </View>
    );
}