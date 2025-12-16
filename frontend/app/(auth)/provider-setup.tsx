import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GradientBackground } from "../../components/GradientBackground";
import { GradientInput } from "../../components/GradientInput";
import { GradientButton } from "../../components/GradientButton";
import { uploadUserAvatar } from "../../utils/storage";
import { ProviderCategory } from "../../types/user";

export default function ProviderSetup() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { firstName, lastName } = params;

    const [companyName, setCompanyName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [category, setCategory] = useState<ProviderCategory>('ACCOMMODATION');
    const [bio, setBio] = useState('');

    // Address
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('');

    const [loading, setLoading] = useState(false);

    const categories: ProviderCategory[] = ['ACCOMMODATION', 'TOURS'];

    const handleCancel = async () => {
        try {
            await auth().currentUser?.delete();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error(error);
            alert('Failed to cancel registration');
        }
    };

    const handleCompleteSetup = async () => {
        if (!companyName || !phoneNumber || !street || !city || !zipCode || !country) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No user found');

            let avatarUrl = undefined;


            await firestore().collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                firstName,
                lastName,
                role: 'PROVIDER',
                verificationStatus: 'UNVERIFIED',
                companyName,
                phoneNumber,
                category,
                bio,
                address: {
                    street,
                    city,
                    zipCode,
                    country
                },

                rating: 0,
                reviewsCount: 0,
                createdAt: Date.now()
            });

            router.replace('/(provider)/profile');
        } catch (error: any) {
            console.error(error);
            alert('Error creating provider profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <GradientBackground variant="full">
            <ScrollView className="w-full flex-1" showsVerticalScrollIndicator={false}>
                <View className="items-center gap-6 w-full">
                    <Text className="text-3xl text-primary font-bold mt-4">Provider Details</Text>

                    <View className="w-full gap-4">
                        <Text className="text-white text-lg font-bold ml-1">Company Info</Text>
                        <GradientInput value={companyName} onChangeText={setCompanyName} placeholder="Company Name" />
                        <GradientInput value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Phone Number" keyboardType="phone-pad" />

                        <Text className="text-white text-lg font-bold ml-1 mt-2">Category</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    className={`px-4 py-2 rounded-full border ${category === cat ? 'bg-neon-primary border-neon-primary' : 'bg-slate-800 border-slate-600'}`}
                                >
                                    <Text className={`font-bold ${category === cat ? 'text-black' : 'text-gray-300'}`}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View className="flex-row items-center justify-between mt-2">
                            <Text className="text-white text-lg font-bold ml-1">Address</Text>
                        </View>
                        <GradientInput value={street} onChangeText={setStreet} placeholder="Street" />
                        <View className="flex-row gap-2">
                            <View className="flex-1">
                                <GradientInput value={city} onChangeText={setCity} placeholder="City" />
                            </View>
                            <View className="flex-1">
                                <GradientInput value={zipCode} onChangeText={setZipCode} placeholder="Zip Code" />
                            </View>
                        </View>
                        <GradientInput value={country} onChangeText={setCountry} placeholder="Country" />

                        <Text className="text-white text-lg font-bold ml-1 mt-2">Bio</Text>
                        <GradientInput
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Tell us about your services..."
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color="#00D4FF" />
                    ) : (
                        <GradientButton onPress={handleCompleteSetup} title="Submit Application" />
                    )}

                    {!loading && (
                        <TouchableOpacity onPress={handleCancel} className="p-2 items-center">
                            <Text className="text-red-400 font-bold">Cancel Registration</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </GradientBackground >
    );
}
