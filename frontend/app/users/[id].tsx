import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { GradientBackground } from "../../components/GradientBackground";
import { OfferCard } from "../../components/OfferCard";
import { ReportModal } from "../../components/ReportModal";
import { Offer } from "../../types/offer";
import { TouristUser, AdminUser, ProviderUser } from "../../types/user";
import { useAccessibility } from "../../contexts/AccessibilityContext";

type UserData = TouristUser | AdminUser | ProviderUser;

export default function PublicProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { isHighContrast } = useAccessibility();

    const [user, setUser] = useState<UserData | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportModalVisible, setReportModalVisible] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                // Fetch User
                const userDoc = await firestore().collection('users').doc(id as string).get();
                const userExists = typeof userDoc.exists === 'function' ? userDoc.exists() : userDoc.exists;

                if (userExists) {
                    const userData = userDoc.data() as UserData;
                    setUser(userData);

                    // If Provider, fetch active offers
                    if (userData.role === 'PROVIDER') {
                        const offersSnapshot = await firestore()
                            .collection('offers')
                            .where('providerId', '==', id)
                            .where('verificationStatus', '==', 'VERIFIED')
                            .get();

                        const fetchedOffers: Offer[] = [];
                        offersSnapshot.forEach(doc => {
                            fetchedOffers.push({ id: doc.id, ...doc.data() } as Offer);
                        });
                        setOffers(fetchedOffers);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <GradientBackground variant="full">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#00D4FF" />
                </View>
            </GradientBackground>
        );
    }

    if (!user) {
        return (
            <GradientBackground variant="full">
                <View className="flex-1 items-center justify-center">
                    <Text className="text-white text-lg">User not found</Text>
                    <TouchableOpacity onPress={() => router.back()} className="mt-4 p-3 bg-slate-800 rounded-lg">
                        <Text className="text-white">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </GradientBackground>
        );
    }

    const renderHeader = () => (
        <View className="items-center px-4 pt-12 pb-6">
            <View className="flex-row justify-between w-full mb-4">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-slate-800/50 rounded-full items-center justify-center">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                {auth().currentUser?.uid !== id && (
                    <TouchableOpacity
                        onPress={() => setReportModalVisible(true)}
                        className="w-10 h-10 bg-red-500/20 border border-red-500/50 rounded-full items-center justify-center"
                    >
                        <Ionicons name="flag" size={20} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>

            <View className={`w-24 h-24 rounded-full overflow-hidden border-4 mb-3 ${isHighContrast ? 'border-white bg-black' : 'border-neon-secondary bg-slate-800'}`}>
                {user.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                    <View className="w-full h-full items-center justify-center bg-slate-700">
                        <Text className="text-white text-3xl font-bold">{user.firstName?.charAt(0)}</Text>
                    </View>
                )}
            </View>

            <Text className="text-2xl font-bold text-white text-center">
                {user.firstName} {user.lastName}
            </Text>

            <View className={`mt-2 px-3 py-1 rounded-full border ${isHighContrast ? 'border-yellow-400' : 'border-neon-primary/50 bg-neon-primary/10'}`}>
                <Text className={`text-xs font-bold uppercase tracking-wider ${isHighContrast ? 'text-yellow-400' : 'text-neon-primary'}`}>
                    {user.role}
                </Text>
            </View>
        </View>
    );

    return (
        <GradientBackground variant="full">
            <FlatList
                ListHeaderComponent={
                    <>
                        {renderHeader()}
                        {user.role === 'PROVIDER' && (
                            <Text className="text-xl font-bold text-white px-4 mb-4 mt-2">Active Offers ({offers.length})</Text>
                        )}
                    </>
                }
                data={user.role === 'PROVIDER' ? offers : []}
                renderItem={({ item }) => <OfferCard offer={item} showStatus={false} showType={true} />}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={
                    user.role === 'PROVIDER' ? (
                        <View className="items-center py-10 opacity-50">
                            <Text className="text-slate-400">No active offers.</Text>
                        </View>
                    ) : null
                }
            />

            <ReportModal
                visible={reportModalVisible}
                onClose={() => setReportModalVisible(false)}
                targetId={id as string}
                targetType="USER"
                targetName={`${user.firstName} ${user.lastName}`}
            />
        </GradientBackground>
    );
}
