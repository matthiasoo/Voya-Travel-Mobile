import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from "react-native";
import { useState, useEffect } from "react";
import firestore from "@react-native-firebase/firestore";
import { GradientBackground } from "../../components/GradientBackground";
import { ProviderUser } from "../../types/user";
import { Offer, AccommodationOffer } from "../../types/offer";
import { Ionicons } from "@expo/vector-icons";

type Tab = 'providers' | 'offers';

export default function AdminApprovals() {
    const [activeTab, setActiveTab] = useState<Tab>('providers');
    const [providers, setProviders] = useState<ProviderUser[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    
    useEffect(() => {
        const unsubscribe = firestore()
            .collection('users')
            .where('role', '==', 'PROVIDER')
            .where('verificationStatus', '==', 'UNVERIFIED')
            .onSnapshot((querySnapshot) => {
                const unverifiedProviders: ProviderUser[] = [];
                querySnapshot.forEach(doc => {
                    unverifiedProviders.push(doc.data() as ProviderUser);
                });
                setProviders(unverifiedProviders);
                if (activeTab === 'providers') setLoading(false);
            }, (error) => {
                console.error("Error fetching unverified providers: ", error);
                if (activeTab === 'providers') setLoading(false);
            });

        return () => unsubscribe();
    }, [activeTab]);

    
    useEffect(() => {
        const unsubscribe = firestore()
            .collection('offers')
            .where('verificationStatus', '==', 'UNVERIFIED')
            .onSnapshot((querySnapshot) => {
                const unverifiedOffers: Offer[] = [];
                querySnapshot.forEach(doc => {
                    unverifiedOffers.push({ id: doc.id, ...doc.data() } as Offer);
                });
                setOffers(unverifiedOffers);
                if (activeTab === 'offers') setLoading(false);
            }, (error) => {
                console.error("Error fetching unverified offers: ", error);
                if (activeTab === 'offers') setLoading(false);
            });

        return () => unsubscribe();
    }, [activeTab]);


    const handleApprove = async (uid: string) => {
        try {
            await firestore().collection('users').doc(uid).update({
                verificationStatus: 'VERIFIED'
            });
        } catch (error) {
            console.error("Error approving provider:", error);
            Alert.alert("Error", "Failed to approve provider.");
        }
    };

    const handleReject = async (uid: string) => {
        try {
            await firestore().collection('users').doc(uid).update({
                verificationStatus: 'REJECTED'
            });
        } catch (error) {
            console.error("Error rejecting provider:", error);
            Alert.alert("Error", "Failed to reject provider.");
        }
    };

    const handleApproveOffer = async (id: string) => {
        try {
            await firestore().collection('offers').doc(id).update({
                verificationStatus: 'VERIFIED'
            });
        } catch (error) {
            console.error("Error approving offer:", error);
            Alert.alert("Error", "Failed to approve offer.");
        }
    };

    const handleRejectOffer = async (id: string) => {
        try {
            await firestore().collection('offers').doc(id).update({
                verificationStatus: 'REJECTED'
            });
        } catch (error) {
            console.error("Error rejecting offer:", error);
            Alert.alert("Error", "Failed to reject offer.");
        }
    };

    const renderProviderItem = ({ item }: { item: ProviderUser }) => (
        <View className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 mb-3">
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-xl font-bold text-white">{item.companyName}</Text>
                    <Text className="text-sm text-text-muted">{item.firstName} {item.lastName}</Text>
                </View>
                <View className="bg-yellow-500/20 px-2 py-1 rounded border border-yellow-500/50">
                    <Text className="text-yellow-400 text-xs font-bold">UNVERIFIED</Text>
                </View>
            </View>

            <Text className="text-gray-300 mb-1">Category: <Text className="text-neon-primary">{item.category}</Text></Text>
            <Text className="text-gray-300 mb-3">Email: {item.email}</Text>

            <View className="flex-row gap-2 mt-2">
                <TouchableOpacity
                    onPress={() => handleApprove(item.uid)}
                    className="flex-1 bg-green-500/20 border border-green-500 p-3 rounded-lg items-center active:bg-green-500/30"
                >
                    <Text className="text-green-400 font-bold">Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleReject(item.uid)}
                    className="flex-1 bg-red-500/20 border border-red-500 p-3 rounded-lg items-center active:bg-red-500/30"
                >
                    <Text className="text-red-400 font-bold">Reject</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderOfferItem = ({ item }: { item: Offer }) => (
        <View className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 mb-3">
            <View className="flex-row gap-4 mb-2">
                {item.images && item.images.length > 0 ? (
                    <Image source={{ uri: item.images[0] }} className="w-20 h-20 rounded-lg bg-slate-700" />
                ) : (
                    <View className="w-20 h-20 rounded-lg bg-slate-700 items-center justify-center">
                        <Ionicons name="image-outline" size={24} color="#64748B" />
                    </View>
                )}

                <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1">
                        <Text className="text-lg font-bold text-white flex-1 mr-2" numberOfLines={1}>{item.title}</Text>
                        <View className="bg-yellow-500/20 px-2 py-1 rounded border border-yellow-500/50">
                            <Text className="text-yellow-400 text-xs font-bold">UNVERIFIED</Text>
                        </View>
                    </View>

                    <Text className="text-gray-300 text-xs mb-1" numberOfLines={1}>
                        <Ionicons name="location-outline" size={12} color="#94A3B8" /> {item.location.address}, {item.location.city}
                    </Text>

                    <Text className="text-neon-primary font-bold">
                        {item.currency} {item.price} <Text className="text-slate-500 font-normal text-xs">/ night</Text>
                    </Text>
                </View>
            </View>

            <View className="flex-row gap-2 mt-2">
                <TouchableOpacity
                    onPress={() => handleApproveOffer(item.id)}
                    className="flex-1 bg-green-500/20 border border-green-500 p-3 rounded-lg items-center active:bg-green-500/30"
                >
                    <Text className="text-green-400 font-bold">Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleRejectOffer(item.id)}
                    className="flex-1 bg-red-500/20 border border-red-500 p-3 rounded-lg items-center active:bg-red-500/30"
                >
                    <Text className="text-red-400 font-bold">Reject</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <GradientBackground variant="full">
            <View className="flex-1 p-4 pt-12">
                <Text className="text-2xl font-bold text-white mb-6">Pending Approvals</Text>

                {}
                <View className="flex-row mb-6 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                    <TouchableOpacity
                        onPress={() => setActiveTab('providers')}
                        className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'providers' ? 'bg-slate-700' : ''}`}
                    >
                        <Text className={`font-bold ${activeTab === 'providers' ? 'text-white' : 'text-slate-400'}`}>Providers</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('offers')}
                        className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'offers' ? 'bg-slate-700' : ''}`}
                    >
                        <Text className={`font-bold ${activeTab === 'offers' ? 'text-white' : 'text-slate-400'}`}>Offers</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#00D4FF" />
                ) : (
                    activeTab === 'providers' ? (
                        providers.length === 0 ? (
                            <View className="flex-1 items-center justify-center opacity-50">
                                <Text className="text-white text-lg font-bold">No pending providers</Text>
                                <Text className="text-text-muted">All providers are verified.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={providers}
                                renderItem={renderProviderItem}
                                keyExtractor={item => item.uid}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        )
                    ) : (
                        offers.length === 0 ? (
                            <View className="flex-1 items-center justify-center opacity-50">
                                <Text className="text-white text-lg font-bold">No pending offers</Text>
                                <Text className="text-text-muted">All offers are verified.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={offers}
                                renderItem={renderOfferItem}
                                keyExtractor={item => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 20 }}
                            />
                        )
                    )
                )}
            </View>
        </GradientBackground>
    );
}
