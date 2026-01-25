import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from 'expo-image';
import { GradientBackground } from "../../components/GradientBackground";
import { GradientInput } from "../../components/GradientInput";
import { useState, useEffect, useMemo } from "react";
import firestore from "@react-native-firebase/firestore";
import { Offer } from "../../types/offer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FilterModal, FilterState } from "../../components/FilterModal";

export default function Index() {
    const [searchQuery, setSearchQuery] = useState("");
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Filter State
    const [filterVisible, setFilterVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState<FilterState>({
        minPrice: '',
        maxPrice: '',
        types: [],
        amenities: [],
        sortBy: null
    });

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
                setLoading(false);
            }, (error) => {
                console.error("Error fetching verified offers: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const filteredOffers = useMemo(() => {
        let result = offers;

        // 1. Text Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(offer =>
                offer.location.city.toLowerCase().includes(query) ||
                offer.location.country.toLowerCase().includes(query) ||
                offer.title.toLowerCase().includes(query)
            );
        }

        // 2. Price Range
        if (activeFilters.minPrice) {
            result = result.filter(o => o.price >= parseFloat(activeFilters.minPrice));
        }
        if (activeFilters.maxPrice) {
            result = result.filter(o => o.price <= parseFloat(activeFilters.maxPrice));
        }

        // 3. Type Filter
        if (activeFilters.types.length > 0) {
            result = result.filter(o => {
                if (activeFilters.types.includes('TOURS') && o.type === 'TOURS') return true;
                if (o.type === 'ACCOMMODATION') {
                    if (activeFilters.types.includes('HOTEL') && o.details?.propertyType === 'HOTEL') return true;
                    if (activeFilters.types.includes('APARTMENT') && o.details?.propertyType === 'APARTMENT') return true;
                }
                return false;
            });
        }

        // 4. Amenities
        if (activeFilters.amenities.length > 0) {
            result = result.filter(o => {
                // If it's a tour, specific amenities might not apply, or we check description?
                // For now, only check accommodation amenities or general description
                if (o.type === 'ACCOMMODATION' && o.details?.generalAmenities) {
                    // Check if offer has ALL selected amenities
                    return activeFilters.amenities.every(amenity =>
                        o.details.generalAmenities.some(a => a.toLowerCase().includes(amenity.toLowerCase()))
                    );
                }
                return false;
            });
        }

        // 5. Sorting
        if (activeFilters.sortBy) {
            result = [...result].sort((a, b) => {
                switch (activeFilters.sortBy) {
                    case 'price_asc': return a.price - b.price;
                    case 'price_desc': return b.price - a.price;
                    case 'rating': return (b.rating || 0) - (a.rating || 0);
                    default: return 0;
                }
            });
        }

        return result;
    }, [offers, searchQuery, activeFilters]);

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
                        <Text className="text-white text-sm font-normal">from</Text> {item.currency} {item.price} <Text className="text-white text-xs font-normal">/ {item.type === 'TOURS' ? 'person' : 'night'}</Text>
                    </Text>
                </View>

                {item.type === 'TOURS' && (
                    <View className="absolute top-2 left-2 bg-purple-500/80 px-2 py-1 rounded">
                        <Text className="text-white text-xs font-bold">TOUR</Text>
                    </View>
                )}
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
                        <Text className="text-white font-bold">{item.rating ? item.rating.toFixed(1) : "New"}</Text>
                        {item.reviewsCount ? <Text className="text-slate-500 text-xs">({item.reviewsCount})</Text> : null}
                    </View>
                    <View className="bg-slate-700 px-2 py-0.5 rounded">
                        <Text className="text-slate-300 text-xs text-transform-capitalize">
                            {item.type === 'TOURS' ? 'Tour' : item.details?.propertyType}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    const activeFiltersCount =
        (activeFilters.minPrice ? 1 : 0) +
        (activeFilters.maxPrice ? 1 : 0) +
        activeFilters.types.length +
        activeFilters.amenities.length +
        (activeFilters.sortBy ? 1 : 0);

    return (
        <GradientBackground variant="full">
            <View className="flex-1 px-4 pt-12 pb-4">
                <Text className="text-3xl font-bold text-white mb-4">Explore</Text>

                <View className="flex-row gap-2 mb-6">
                    <View className="flex-1">
                        <GradientInput
                            placeholder="Search city or country..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={() => setFilterVisible(true)}
                        className={`w-12 h-12 rounded-xl items-center justify-center border ${activeFiltersCount > 0 ? 'bg-neon-primary/20 border-neon-primary' : 'bg-slate-800 border-slate-700'}`}
                    >
                        <Ionicons name="options" size={24} color={activeFiltersCount > 0 ? '#00D4FF' : '#94A3B8'} />
                        {activeFiltersCount > 0 && (
                            <View className="absolute -top-1 -right-1 w-4 h-4 bg-neon-primary rounded-full items-center justify-center">
                                <Text className="text-black text-[10px] font-bold">{activeFiltersCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <FilterModal
                    visible={filterVisible}
                    onClose={() => setFilterVisible(false)}
                    initialFilters={activeFilters}
                    onApply={(filters) => {
                        setActiveFilters(filters);
                        setFilterVisible(false);
                    }}
                />

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
