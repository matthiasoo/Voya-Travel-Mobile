import { View, Text, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { Image } from "expo-image";
import { GradientBackground } from "../../components/GradientBackground";
import { GradientButton } from "../../components/GradientButton";
import { GradientInput } from "../../components/GradientInput";
import { BaseUser } from "../../types/user";
import * as ImagePicker from 'expo-image-picker';
import { uploadUserAvatar } from "../../utils/storage";
import { TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const [user, setUser] = useState<BaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [newImageUri, setNewImageUri] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const currentUser = auth().currentUser;
        if (!currentUser) return;

        const unsubscribe = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot((documentSnapshot) => {
                if (documentSnapshot.exists) {
                    setUser(documentSnapshot.data() as BaseUser);
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user data: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    // Load initial values into edit state when editing starts or user loads
    useEffect(() => {
        if (user) {
            setEditFirstName(user.firstName);
            setEditLastName(user.lastName);
        }
    }, [user, isEditing]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setNewImageUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            let avatarUrl = user.avatarUrl;

            if (newImageUri) {
                avatarUrl = await uploadUserAvatar(user.uid, newImageUri);
            }

            await firestore().collection('users').doc(user.uid).update({
                firstName: editFirstName,
                lastName: editLastName,
                avatarUrl
            });

            setIsEditing(false);
            setNewImageUri(null);
        } catch (error: any) {
            alert('Error updating profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await auth().signOut();
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    if (loading) {
        return (
            <GradientBackground>
                <ActivityIndicator size="large" color="#00D4FF" />
            </GradientBackground>
        );
    }

    return (
        <GradientBackground>
            <View className="items-center gap-6 w-full">
                {/* Avatar Section */}
                <View className="items-center relative">
                    <View className="w-32 h-32 rounded-full overflow-hidden border-4 border-neon-primary bg-slate-800 items-center justify-center shadow-neon-primary">
                        {newImageUri ? (
                            <Image
                                source={{ uri: newImageUri }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                            />
                        ) : user?.avatarUrl ? (
                            <Image
                                source={{ uri: user.avatarUrl }}
                                style={{ width: '100%', height: '100%' }}
                                contentFit="cover"
                                transition={500}
                            />
                        ) : (
                            <Text className="text-4xl font-bold text-text-muted">
                                {user ? getInitials(user.firstName, user.lastName) : "?"}
                            </Text>
                        )}
                    </View>
                    {isEditing && (
                        <TouchableOpacity
                            onPress={pickImage}
                            className="absolute bottom-0 right-0 bg-neon-secondary p-2 rounded-full border-2 border-slate-900"
                        >
                            <Ionicons name="camera" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Info Section */}
                {isEditing ? (
                    <View className="w-full gap-4">
                        <GradientInput
                            value={editFirstName}
                            onChangeText={setEditFirstName}
                            placeholder="First Name"
                        />
                        <GradientInput
                            value={editLastName}
                            onChangeText={setEditLastName}
                            placeholder="Last Name"
                        />
                    </View>
                ) : (
                    <View className="items-center gap-2">
                        <Text className="text-3xl font-bold text-white text-center">
                            {user?.firstName} {user?.lastName}
                        </Text>
                        <Text className="text-text-muted text-lg">{user?.email}</Text>
                        <View className="px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700 mt-2">
                            <Text className="text-neon-secondary text-sm font-bold uppercase tracking-wider">
                                {user?.role}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View className="w-full mt-4 gap-4">
                    {isEditing ? (
                        <View className="gap-3">
                            {saving ? (
                                <ActivityIndicator color="#00D4FF" />
                            ) : (
                                <>
                                    <GradientButton onPress={handleSave} title="Save Changes" />
                                    <TouchableOpacity
                                        onPress={() => {
                                            setIsEditing(false);
                                            setNewImageUri(null);
                                        }}
                                        className="items-center p-2"
                                    >
                                        <Text className="text-text-muted">Cancel</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    ) : (
                        <>
                            <GradientButton onPress={() => setIsEditing(true)} title="Edit Profile" />
                            <TouchableOpacity onPress={handleSignOut} className="items-center p-2">
                                <Text className="text-red-400 font-bold">Log Out</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </GradientBackground>
    );
}
