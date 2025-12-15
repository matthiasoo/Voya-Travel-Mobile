import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from 'expo-image';
import { GradientBackground } from "../../components/GradientBackground";
import { GradientInput } from "../../components/GradientInput";
import { useState, useEffect } from "react";
import firestore from "@react-native-firebase/firestore";
import { Offer } from "../../types/offer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Index() {
    const [searchQuery, setSearchQuery] = useState("");
    const [offers, setOffers] = useState<Offer[]>([]);
    const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('offers')
            .where('verificationStatus', '==', 'VERIFIED')
            .onSnapshot((querySnapshot) => {
                const verifiedOffers: Offer[] = [];
                querySnapshot.forEach(doc => {
                    verifiedOffers.push({ id: doc.id, ...doc.data() } as Offer);
                });
                setOffers(verifiedOffers);
                setFilteredOffers(verifiedOffers);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching verified offers: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredOffers(offers);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = offers.filter(offer =>
            offer.location.city.toLowerCase().includes(query) ||
            offer.location.country.toLowerCase().includes(query)
        );
        setFilteredOffers(filtered);
    }, [searchQuery, offers]);

    const renderOfferItem = ({ item }: { item: Offer }) => (
        <TouchableOpacity
            onPress={() => router.push(`/offer/${item.id}`)}
            className="bg-slate-800/80 rounded-xl border border-slate-700 mb-4 overflow-hidden"
        >
            <View className="h-48 w-full bg-slate-700 relative">
                {item.images && item.images.length > 0 ? (
                    <Image
                        source={{ uri: item.images[0] }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={1000}
                    />
                ) : (
                    <View className="w-full h-full items-center justify-center">
                        <Ionicons name="image-outline" size={48} color="#64748B" />
                    </View>
                )}
                <View className="absolute bottom-2 right-2 bg-slate-900/80 px-2 py-1 rounded">
                    <Text className="text-neon-primary font-bold">
                        <Text className="text-white text-sm font-normal">from</Text> {item.currency} {item.price} <Text className="text-white text-xs font-normal">/ night</Text>
                    </Text>
                </View>
            </View>

            <View className="p-4">
                <Text className="text-xl font-bold text-white mb-1" numberOfLines={1}>{item.title}</Text>
                <View className="flex-row items-center gap-1 mb-2">
                    <Ionicons name="location-outline" size={14} color="#94A3B8" />
                    <Text className="text-slate-400 text-sm">{item.location.city}, {item.location.country}</Text>
                </View>

                <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1">
                        <Ionicons name="star" size={14} color="#FBBF24" />
                        <Text className="text-white font-bold">{item.rating || "New"}</Text>
                    </View>
                    <View className="bg-slate-700 px-2 py-0.5 rounded">
                        <Text className="text-slate-300 text-xs">{item.details?.propertyType}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <GradientBackground variant="full">
            <View className="flex-1 px-4 pt-12 pb-4">
                <Text className="text-3xl font-bold text-white mb-4">Explore</Text>

                <View className="mb-6">
                    <GradientInput
                        placeholder="Search city or country..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#00D4FF" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredOffers}
                        renderItem={renderOfferItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center py-10 opacity-50">
                                <Text className="text-white text-lg font-bold">No places found</Text>
                                <Text className="text-text-muted text-center">Try adjusting your search criteria.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </GradientBackground>
    );
}
