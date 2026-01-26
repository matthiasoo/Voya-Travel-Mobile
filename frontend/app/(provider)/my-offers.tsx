import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { useState, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";

import { GradientBackground } from "../../components/GradientBackground";
import { OfferCard } from "../../components/OfferCard";
import { Offer, VerificationStatus } from "../../types/offer";

type FilterType = 'ALL' | VerificationStatus;

export default function MyOffersScreen() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('ALL');
    const router = useRouter();
    const currentUser = auth().currentUser;

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = firestore()
            .collection('offers')
            .where('providerId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const fetchedOffers: Offer[] = [];
                snapshot.forEach(doc => {
                    // We can cast data to Offer since we control the schema
                    fetchedOffers.push({ id: doc.id, ...doc.data() } as Offer);
                });
                setOffers(fetchedOffers);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching offers: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [currentUser]);

    const filteredOffers = offers.filter(offer => {
        if (filter === 'ALL') return true;
        return offer.verificationStatus === filter;
    });

    const getStatusColor = (status: VerificationStatus) => {
        switch (status) {
            case 'VERIFIED': return 'text-green-400 border-green-500/50 bg-green-500/10';
            case 'REJECTED': return 'text-red-400 border-red-500/50 bg-red-500/10';
            case 'UNVERIFIED': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
            default: return 'text-gray-400';
        }
    };

    const renderOfferItem = ({ item }: { item: Offer }) => (
        <OfferCard offer={item} showStatus={true} showType={true} />
    );

    return (
        <GradientBackground variant="full">
            <View className="flex-1 pt-12">
                <View className="px-4 mb-4">
                    <Text className="text-3xl font-bold text-white mb-4">My Offers</Text>

                    {/* Filter Tabs */}
                    <View className="flex-row gap-2">
                        {(['ALL', 'VERIFIED', 'UNVERIFIED', 'REJECTED'] as const).map((status) => (
                            <TouchableOpacity
                                key={status}
                                onPress={() => setFilter(status)}
                                className={`px-3 py-1.5 rounded-full border ${filter === status
                                    ? 'bg-neon-primary border-neon-primary'
                                    : 'bg-slate-800/50 border-slate-600'
                                    }`}
                            >
                                <Text className={`text-xs font-bold ${filter === status ? 'text-black' : 'text-slate-300'}`}>
                                    {status}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#00D4FF" />
                    </View>
                ) : filteredOffers.length === 0 ? (
                    <View className="flex-1 items-center justify-center px-4">
                        <Ionicons name="documents-outline" size={64} color="#334155" />
                        <Text className="text-white text-lg font-bold mt-4">No properties found</Text>
                        <Text className="text-slate-400 text-center mt-2">
                            {filter !== 'ALL'
                                ? `No ${filter.toLowerCase()} properties found.`
                                : "You haven't added any properties yet."}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredOffers}
                        renderItem={renderOfferItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </GradientBackground>
    );
}
