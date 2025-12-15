import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { GradientBackground } from "../../components/GradientBackground";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GradientInput } from '../../components/GradientInput';
import { GradientButton } from '../../components/GradientButton';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { uploadUserAvatar } from '../../utils/storage';

export default function BaseUserSetup() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleRegisterAsTourist = async () => {
        if (!firstName || !lastName) {
            alert('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No user found');

            let avatarUrl = undefined;
            if (imageUri) {
                avatarUrl = await uploadUserAvatar(user.uid, imageUri);
            }

            await firestore().collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                firstName,
                lastName,
                role: 'TOURIST',
                avatarUrl: avatarUrl ?? "",
                createdAt: Date.now(),
            });

            router.replace('/(tourist)');
        } catch (error: any) {
            console.error(error);
            alert('Error saving profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleProviderSetup = () => {
        if (!firstName || !lastName) {
            alert('Please fill in your name first');
            return;
        }
        console.log('Navigating to provider setup');

        // Navigate to provider setup, passing names
        router.push({
            pathname: '/(auth)/provider-setup',
            params: { firstName, lastName }
        });
        console.log('Navigated to provider setup');
    };

    const handleCancel = async () => {
        try {
            await auth().currentUser?.delete();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error(error);
            alert('Failed to cancel registration');
        }
    };

    return (
        <GradientBackground>
            <View className="items-center">
                <Text className="text-4xl font-extrabold text-neon-primary mb-2 shadow-neon-primary">Profile Setup</Text>
                <Text className="text-text-muted text-lg">Tell us a bit about yourself</Text>
            </View>

            <TouchableOpacity onPress={pickImage} className="items-center py-4">
                <View className="h-32 w-32 rounded-full bg-slate-800 border-2 border-dashed border-neon-secondary items-center justify-center overflow-hidden">
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    ) : (
                        <Text className="text-text-muted text-center px-2">Tap to add photo</Text>
                    )}
                </View>
            </TouchableOpacity>

            <View className="gap-4">
                <GradientInput
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                />
                <GradientInput
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#00D4FF" />
            ) : (
                <View className="gap-4">
                    <GradientButton onPress={handleRegisterAsTourist} title="Complete Setup" />

                    <TouchableOpacity onPress={handleCancel} className="p-2 items-center">
                        <Text className="text-red-400 font-bold">Cancel Registration</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleProviderSetup}
                        className="p-2 items-center"
                    >
                        <Text className="text-neon-secondary font-bold text-lg">I'm a provider</Text>
                    </TouchableOpacity>
                </View>
            )}
        </GradientBackground>
    );
}
