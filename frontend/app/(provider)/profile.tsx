import { View, Text, ActivityIndicator, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useState, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { GradientBackground } from "../../components/GradientBackground";
import { GradientButton } from "../../components/GradientButton";
import { GradientInput } from "../../components/GradientInput";
import { ProviderUser } from "../../types/user";
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility } from "../../contexts/AccessibilityContext";

export default function ProviderProfileScreen() {
    const [user, setUser] = useState<ProviderUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const { isHighContrast, toggleHighContrast } = useAccessibility();

    
    const [editCompanyName, setEditCompanyName] = useState('');
    const [editPhoneNumber, setEditPhoneNumber] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editStreet, setEditStreet] = useState('');
    const [editCity, setEditCity] = useState('');
    const [editZipCode, setEditZipCode] = useState('');
    const [editCountry, setEditCountry] = useState('');

    useEffect(() => {
        const currentUser = auth().currentUser;
        if (!currentUser) return;

        const unsubscribe = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot((documentSnapshot) => {
                if (documentSnapshot.exists) {
                    setUser(documentSnapshot.data() as ProviderUser);
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user data: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (user) {
            setEditCompanyName(user.companyName);
            setEditPhoneNumber(user.phoneNumber);
            setEditBio(user.bio || '');
            setEditStreet(user.address?.street || '');
            setEditCity(user.address?.city || '');
            setEditZipCode(user.address?.zipCode || '');
            setEditCountry(user.address?.country || '');
        }
    }, [user, isEditing]);


    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {


            await firestore().collection('users').doc(user.uid).update({
                companyName: editCompanyName,
                phoneNumber: editPhoneNumber,
                bio: editBio,
                address: {
                    street: editStreet,
                    city: editCity,
                    zipCode: editZipCode,
                    country: editCountry
                },
            });

            setIsEditing(false);
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

    const getInitials = (name: string) => {
        return name ? name.substring(0, 2).toUpperCase() : "CO";
    };

    if (loading) {
        return (
            <GradientBackground variant="full">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#00D4FF" />
                </View>
            </GradientBackground>
        );
    }

    const verificationColor =
        user?.verificationStatus === 'VERIFIED' ? 'bg-green-500/20 border-green-500 text-green-400' :
            user?.verificationStatus === 'REJECTED' ? 'bg-red-500/20 border-red-500 text-red-400' :
                'bg-yellow-500/20 border-yellow-500 text-yellow-400';

    return (
        <GradientBackground variant="full">
            <ScrollView className="w-full flex-1" showsVerticalScrollIndicator={false}>
                <View className="items-center gap-6 w-full pb-8 pt-4">

                    {}
                    <View className="items-center relative">
                        <View className={`w-32 h-32 rounded-full overflow-hidden border-4 ${isHighContrast ? 'border-white bg-black' : 'border-neon-primary bg-slate-800'} items-center justify-center shadow-neon-primary`}>
                            <Ionicons name="business" size={64} color={isHighContrast ? "#FACC15" : "#7F00FF"} />
                        </View>
                    </View>

                    {}
                    {!isEditing && (
                        <View className="items-center gap-2">
                            <Text className={`text-3xl font-bold ${isHighContrast ? 'text-white' : 'text-white'} text-center`}>
                                {user?.companyName}
                            </Text>
                            <Text className={`text-lg font-medium text-center ${isHighContrast ? 'text-gray-300' : 'text-gray-300'}`}>
                                {user?.firstName} {user?.lastName}
                            </Text>
                            <View className={`px-3 py-1 ${isHighContrast ? 'bg-yellow-400/20 border-yellow-400' : 'bg-neon-primary/20 border-neon-primary'} rounded-full border mt-2`}>
                                <Text className={`text-sm font-bold uppercase tracking-wider ${isHighContrast ? 'text-yellow-400' : 'text-neon-primary'}`}>
                                    {user?.category}
                                </Text>
                            </View>
                            <Text className={`text-sm font-bold uppercase tracking-wider ${verificationColor.split(' ')[2]}`}>
                                • {user?.verificationStatus}
                            </Text>
                        </View>
                    )}

                    {}
                    {isEditing ? (
                        <View className="w-full gap-4">
                            <Text className="text-white text-lg font-bold ml-1">Company Info</Text>
                            <GradientInput value={editCompanyName} onChangeText={setEditCompanyName} placeholder="Company Name" />
                            <GradientInput value={editPhoneNumber} onChangeText={setEditPhoneNumber} placeholder="Phone Number" keyboardType="phone-pad" />

                            <Text className="text-white text-lg font-bold ml-1 mt-2">Address</Text>
                            <GradientInput value={editStreet} onChangeText={setEditStreet} placeholder="Street" />
                            <View className="flex-row gap-2">
                                <View className="flex-1">
                                    <GradientInput value={editCity} onChangeText={setEditCity} placeholder="City" />
                                </View>
                                <View className="flex-1">
                                    <GradientInput value={editZipCode} onChangeText={setEditZipCode} placeholder="Zip Code" />
                                </View>
                            </View>
                            <GradientInput value={editCountry} onChangeText={setEditCountry} placeholder="Country" />

                            <Text className="text-white text-lg font-bold ml-1 mt-2">Bio</Text>
                            <GradientInput
                                value={editBio}
                                onChangeText={setEditBio}
                                placeholder="Bio"
                                multiline
                                numberOfLines={4}
                            />
                        </View>
                    ) : (
                        <View className={`w-full gap-4 ${isHighContrast ? 'bg-neutral-900 border-2 border-white' : 'bg-slate-800/40 border-slate-700'} p-4 rounded-xl border`}>
                            <View>
                                <Text className={`text-xs uppercase font-bold ${isHighContrast ? 'text-gray-400' : 'text-text-muted'}`}>Bio</Text>
                                <Text className="text-white text-base leading-6">{user?.bio || 'No bio provided.'}</Text>
                            </View>
                            <View className={`h-[1px] ${isHighContrast ? 'bg-gray-600' : 'bg-slate-700/50'}`} />
                            <View>
                                <Text className={`text-xs uppercase font-bold ${isHighContrast ? 'text-gray-400' : 'text-text-muted'}`}>Contact</Text>
                                <Text className="text-white text-base">{user?.phoneNumber}</Text>
                                <Text className="text-white text-base">{user?.email}</Text>
                            </View>
                            <View className={`h-[1px] ${isHighContrast ? 'bg-gray-600' : 'bg-slate-700/50'}`} />
                            <View>
                                <Text className={`text-xs uppercase font-bold ${isHighContrast ? 'text-gray-400' : 'text-text-muted'}`}>Address</Text>
                                <Text className="text-white text-base">
                                    {user?.address?.street}, {user?.address?.city}
                                </Text>
                                <Text className="text-white text-base">
                                    {user?.address?.zipCode}, {user?.address?.country}
                                </Text>
                            </View>
                        </View>
                    )}

                    {}
                    <View className={`w-full p-4 rounded-xl ${isHighContrast ? 'bg-neutral-900 border-2 border-white' : 'bg-void-surface'}`}>
                        <Text className={`text-lg font-bold mb-3 ${isHighContrast ? 'text-white' : 'text-white'}`}>
                            Accessibility
                        </Text>
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-3">
                                <Ionicons
                                    name="contrast"
                                    size={24}
                                    color={isHighContrast ? '#FACC15' : '#00D4FF'}
                                />
                                <Text className={`text-base ${isHighContrast ? 'text-white' : 'text-text-main'}`}>
                                    High Contrast Mode
                                </Text>
                            </View>
                            <Switch
                                value={isHighContrast}
                                onValueChange={toggleHighContrast}
                                trackColor={{
                                    false: '#3f3f46',
                                    true: isHighContrast ? '#FACC15' : '#7F00FF'
                                }}
                                thumbColor={isHighContrast ? '#000000' : '#ffffff'}
                            />
                        </View>
                    </View>

                    {}
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
            </ScrollView>
        </GradientBackground >
    );
}

