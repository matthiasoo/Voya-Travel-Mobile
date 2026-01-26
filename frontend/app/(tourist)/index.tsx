import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientBackground } from "../../components/GradientBackground";
import { GradientInput } from "../../components/GradientInput";
import { OfferCard } from "../../components/OfferCard";
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
        <OfferCard offer={item} showStatus={false} showType={true} />
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

                <View className="flex-row gap-3 mb-6 items-center">
                    <View className="flex-1">
                        <GradientInput
                            placeholder="Search city or country..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            icon={<Ionicons name="search" size={20} color="#94A3B8" />}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={() => setFilterVisible(true)}
                        className="h-[52px] w-[52px] rounded-xl overflow-hidden"
                    >
                        <LinearGradient
                            colors={activeFiltersCount > 0 ? ['#7F00FF', '#00D4FF'] : ['#1E293B', '#1E293B']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="w-full h-full p-[1.5px] items-center justify-center rounded-xl"
                        >
                            <View className={`w-full h-full rounded-xl items-center justify-center ${activeFiltersCount > 0 ? 'bg-slate-900/90' : 'bg-slate-800'}`}>
                                <Ionicons
                                    name="options"
                                    size={24}
                                    color={activeFiltersCount > 0 ? '#00D4FF' : '#94A3B8'}
                                />
                                {activeFiltersCount > 0 && (
                                    <View className="absolute top-3 right-3 w-2 h-2 bg-neon-primary rounded-full" />
                                )}
                            </View>
                        </LinearGradient>
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
