import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import MapView, { Marker, PROVIDER_GOOGLE, Region, Callout } from "react-native-maps";
import firestore from "@react-native-firebase/firestore";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Offer } from "../../types/offer";

const INITIAL_REGION: Region = {
    latitude: 51.7592,
    longitude: 19.4560,
    latitudeDelta: 5,
    longitudeDelta: 5,
};

export default function MapScreen() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [region, setRegion] = useState<Region>(INITIAL_REGION);
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
    const mapRef = useRef<MapView>(null);
    const router = useRouter();

    // Fetch verified offers
    useEffect(() => {
        try {
            const unsubscribe = firestore()
                .collection('offers')
                .where('verificationStatus', '==', 'VERIFIED')
                .onSnapshot((snapshot) => {
                    const fetchedOffers = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Offer));
                    setOffers(fetchedOffers);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching offers:", error);
                    setLoading(false);
                });

            return () => unsubscribe();
        } catch (error) {
            console.error("Map init error:", error);
            setLoading(false);
        }
    }, []);

    const handleMarkerPress = useCallback((offer: Offer) => {
        setSelectedOffer(offer);
    }, []);

    const handleNavigateToOffer = useCallback(() => {
        if (selectedOffer) {
            router.push(`/offer/${selectedOffer.id}`);
        }
    }, [selectedOffer, router]);

    const handleCloseCard = useCallback(() => {
        setSelectedOffer(null);
    }, []);

    const getMarkerColor = (type: string) => {
        return type === 'TOURS' ? '#00D4FF' : '#7F00FF';
    };

    return (
        <View className="flex-1 bg-slate-900">
            {/* Map */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                initialRegion={INITIAL_REGION}
                onRegionChangeComplete={setRegion}
                showsUserLocation
                showsMyLocationButton
                customMapStyle={darkMapStyle}
            >
                {offers.map((offer) => (
                    <Marker
                        key={offer.id}
                        coordinate={{
                            latitude: offer.location.latitude,
                            longitude: offer.location.longitude
                        }}
                        onPress={() => handleMarkerPress(offer)}
                        title={`${offer.currency}${offer.price}`}
                        description={offer.title}
                    >
                        <Ionicons
                            name="location"
                            size={40}
                            color={offer.type === 'TOURS' ? '#7F00FF' : '#00D4FF'}
                        />
                    </Marker>
                ))}
            </MapView>

            {/* Loading Overlay */}
            {loading && (
                <View className="absolute inset-0 bg-slate-900/50 items-center justify-center">
                    <ActivityIndicator size="large" color="#00D4FF" />
                    <Text className="text-white mt-2">Loading offers...</Text>
                </View>
            )}

            {/* Header */}
            <View className="absolute top-12 left-4 right-4">
                <View className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 flex-row items-center">
                    <Ionicons name="map" size={20} color="#00D4FF" />
                    <Text className="text-white font-bold ml-2">Explore Map</Text>
                    <View className="flex-1" />
                    <Text className="text-slate-400 text-xs">{offers.length} offers</Text>
                </View>
            </View>

            {/* Legend */}
            <View className="absolute top-28 left-4 bg-slate-900/90 p-2 rounded-lg border border-slate-700">
                <View className="flex-row items-center gap-2 mb-1">
                    <View className="w-3 h-3 rounded-full bg-neon-secondary" />
                    <Text className="text-slate-300 text-xs">Stays</Text>
                </View>
                <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-neon-primary" />
                    <Text className="text-slate-300 text-xs">Tours</Text>
                </View>
            </View>

            {/* Selected Offer Card */}
            {selectedOffer && (
                <View className="absolute bottom-6 left-4 right-4">
                    <View className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                        <TouchableOpacity
                            onPress={handleNavigateToOffer}
                            className="flex-row"
                            activeOpacity={0.9}
                        >
                            {/* Image */}
                            <View className="w-28 h-28 bg-slate-700">
                                {selectedOffer.images?.[0] ? (
                                    <Image
                                        source={{ uri: selectedOffer.images[0] }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <View className="flex-1 items-center justify-center">
                                        <Ionicons name="image-outline" size={32} color="#64748B" />
                                    </View>
                                )}
                            </View>

                            {/* Content */}
                            <View className="flex-1 p-3 justify-between">
                                <View>
                                    <View className="flex-row items-center gap-2 mb-1">
                                        <View className={`px-2 py-0.5 rounded ${selectedOffer.type === 'TOURS' ? 'bg-neon-primary/20' : 'bg-neon-secondary/20'}`}>
                                            <Text className={`text-xs font-bold ${selectedOffer.type === 'TOURS' ? 'text-neon-primary' : 'text-neon-secondary'}`}>
                                                {selectedOffer.type === 'TOURS' ? 'TOUR' : 'STAY'}
                                            </Text>
                                        </View>
                                        {selectedOffer.rating > 0 && (
                                            <View className="flex-row items-center gap-1">
                                                <Ionicons name="star" size={12} color="#FBBF24" />
                                                <Text className="text-yellow-500 text-xs font-bold">{selectedOffer.rating.toFixed(1)}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text className="text-white font-bold" numberOfLines={1}>{selectedOffer.title}</Text>
                                    <Text className="text-slate-400 text-xs" numberOfLines={1}>
                                        {selectedOffer.location.city}, {selectedOffer.location.country}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between items-end">
                                    <Text className="text-neon-primary font-bold">
                                        {selectedOffer.currency} {selectedOffer.price}
                                        <Text className="text-slate-500 text-xs font-normal"> /{selectedOffer.type === 'TOURS' ? 'person' : 'night'}</Text>
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color="#00D4FF" />
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Close button */}
                        <TouchableOpacity
                            onPress={handleCloseCard}
                            className="absolute top-2 right-2 bg-slate-900/80 rounded-full p-1"
                        >
                            <Ionicons name="close" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

// Dark map style for Google Maps
const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
    { featureType: "landscape", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
    { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
    { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#1e3a5f" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5af" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#475569" }] },
    { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c4a6e" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
];
