import { View, Text } from "react-native";
import { GradientBackground } from "../../components/GradientBackground";
import { GradientInput } from "../../components/GradientInput";
import { GradientButton } from "../../components/GradientButton";
import { useState } from "react";
import { useRouter } from "expo-router";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const router = useRouter();

    return (
        <GradientBackground>
            <View className="items-center w-full gap-6">
                <Text className="text-3xl font-bold text-white mb-2">Reset Password</Text>
                <Text className="text-text-muted text-center mb-4">Enter your email address and we'll send you a link to reset your password.</Text>

                <GradientInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="E-mail"
                />

                <View className="w-full gap-4 mt-2">
                    <GradientButton
                        title="Send Reset Link"
                        onPress={() => alert('Reset link sent!')}
                    />
                    <GradientButton
                        title="Back to Login"
                        onPress={() => router.back()}
                    // variant="outline" // Assuming we might want an outline variant later, but standard is fine for now or I can implement "Cancel" style
                    />
                </View>
            </View>
        </GradientBackground>
    );
}
