import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, useWindowDimensions } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { GradientBackground } from "../../components/GradientBackground";
import { Offer } from "../../types/offer";

export default function OfferDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { width } = useWindowDimensions();

    const [offer, setOffer] = useState<Offer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const unsubscribe = firestore()
            .collection('offers')
            .doc(id as string)
            .onSnapshot((doc) => {
                // Handle both property and function cases for compatibility
                const exists = typeof doc.exists === 'function' ? doc.exists() : doc.exists;
                if (exists) {
                    setOffer({ id: doc.id, ...doc.data() } as Offer);
                } else {
                    console.log("No such document!");
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching offer details: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
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

    if (!offer) {
        return (
            <GradientBackground variant="full">
                <View className="flex-1 items-center justify-center p-4">
                    <Ionicons name="alert-circle-outline" size={64} color="#64748b" />
                    <Text className="text-white text-xl font-bold mt-4">Offer not found</Text>
                    <TouchableOpacity onPress={() => router.back()} className="mt-4 p-3 bg-slate-800 rounded-lg">
                        <Text className="text-white font-bold">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground variant="full">
            <View className="flex-1">
                {/* Header */}
                <View className="absolute top-0 left-0 right-0 z-10 pt-12 px-4 flex-row justify-between items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    {/* Status Badge in Header */}
                    <View className={`px-3 py-1 rounded-full border bg-black/30 backdrop-blur-md ${offer.verificationStatus === 'VERIFIED' ? 'border-green-500 text-green-400' :
                        offer.verificationStatus === 'REJECTED' ? 'border-red-500 text-red-400' :
                            'border-yellow-500 text-yellow-400'
                        }`}>
                        <Text className={`text-xs font-bold ${offer.verificationStatus === 'VERIFIED' ? 'text-green-400' :
                            offer.verificationStatus === 'REJECTED' ? 'text-red-400' :
                                'text-yellow-400'
                            }`}>
                            {offer.verificationStatus}
                        </Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Images Carousel */}
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                        {offer.images && offer.images.length > 0 ? (
                            offer.images.map((img, index) => (
                                <Image
                                    key={index}
                                    source={{ uri: img }}
                                    style={{ width, height: 300 }}
                                    contentFit="cover"
                                    transition={500}
                                />
                            ))
                        ) : (
                            <View style={{ width, height: 300 }} className="bg-slate-800 items-center justify-center">
                                <Ionicons name="image-outline" size={64} color="#475569" />
                                <Text className="text-slate-500 mt-2">No images available</Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Content Body */}
                    <View className="px-4 py-6 gap-6">

                        {/* Title & Price */}
                        <View>
                            <Text className="text-2xl font-bold text-white mb-2">{offer.title}</Text>
                            <Text className="text-neon-primary text-xl font-bold">
                                <Text className="text-slate-400 text-sm font-normal">from</Text> {offer.currency} {offer.price} <Text className="text-slate-400 text-sm font-normal">/ night</Text>
                            </Text>

                            <View className="flex-row items-center gap-1 mt-2">
                                <Ionicons name="location" size={16} color="#94a3b8" />
                                <Text className="text-slate-300">{offer.location.address}, {offer.location.city}, {offer.location.country}</Text>
                            </View>
                        </View>

                        {/* Description */}
                        <View>
                            <Text className="text-lg font-bold text-white mb-2">About</Text>
                            <Text className="text-slate-300 leading-6">{offer.description}</Text>
                        </View>

                        {/* Property Details */}
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: 'demo' } })}
                            className="bg-neon-primary p-3 rounded-xl flex-row items-center justify-center -mb-2 z-10"
                        >
                            <Ionicons name="chatbubbles" size={20} color="white" />
                            <Text className="text-white font-bold ml-2">Chat with Provider</Text>
                        </TouchableOpacity>

                        <View className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 gap-4">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-lg font-bold text-white">Details</Text>
                                <TouchableOpacity
                                    onPress={() => router.push(`/offer/create-unit?offerId=${id}`)}
                                    className="flex-row items-center bg-neon-primary/20 px-3 py-1 rounded-full border border-neon-primary/50"
                                >
                                    <Ionicons name="add" size={16} color="#7F00FF" />
                                    <Text className="text-neon-primary font-bold text-xs ml-1">Add Unit</Text>
                                </TouchableOpacity>
                            </View>



                            <View className="flex-row flex-wrap gap-4">
                                <View className="bg-slate-900 px-3 py-2 rounded-lg">
                                    <Text className="text-slate-400 text-xs">Type</Text>
                                    <Text className="text-white font-bold">{offer.details.propertyType}</Text>
                                </View>
                                <View className="bg-slate-900 px-3 py-2 rounded-lg">
                                    <Text className="text-slate-400 text-xs">Check-in</Text>
                                    <Text className="text-white font-bold">{offer.details.checkInTime}</Text>
                                </View>
                                <View className="bg-slate-900 px-3 py-2 rounded-lg">
                                    <Text className="text-slate-400 text-xs">Check-out</Text>
                                    <Text className="text-white font-bold">{offer.details.checkOutTime}</Text>
                                </View>
                            </View>

                            <View>
                                <Text className="text-slate-400 text-sm mb-2">Amenities</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {offer.details.generalAmenities.map((amenity, index) => (
                                        <View key={index} className="bg-slate-700/50 px-3 py-1 rounded-full">
                                            <Text className="text-slate-200 text-xs">{amenity}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Units List */}
                        <View>
                            <Text className="text-lg font-bold text-white mb-4">Units</Text>
                            {offer.details.units && offer.details.units.length > 0 ? (
                                <View className="gap-4">
                                    {offer.details.units.map((unit, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => router.push({ pathname: "/offer/units/[id]", params: { id: unit.id, offerId: offer.id } })}
                                            className="bg-slate-800/90 rounded-xl overflow-hidden border border-slate-700 flex-row"
                                        >
                                            <Image
                                                source={{ uri: unit.images?.[0] }}
                                                style={{ width: 100, height: 100 }}
                                                contentFit="cover"
                                            />
                                            <View className="flex-1 p-3 justify-between">
                                                <View>
                                                    <Text className="text-white font-bold text-lg" numberOfLines={1}>{unit.name}</Text>
                                                    <Text className="text-slate-400 text-xs">{unit.type.replace(/_/g, ' ')}</Text>
                                                </View>
                                                <View className="flex-row justify-between items-end">
                                                    <View>
                                                        <Text className="text-neon-primary font-bold">{offer.currency} {unit.pricePerNight}</Text>
                                                        <Text className="text-slate-500 text-xs">per night</Text>
                                                    </View>
                                                    <View className="flex-row gap-2">
                                                        <View className="flex-row items-center gap-1 bg-slate-700/50 px-2 py-1 rounded">
                                                            <Ionicons name="people" size={12} color="#94a3b8" />
                                                            <Text className="text-slate-300 text-xs">{unit.capacity.adults}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <Text className="text-slate-500 italic">No units added yet.</Text>
                            )}
                        </View>

                        {/* Map */}
                        <View>
                            <Text className="text-lg font-bold text-white mb-4">Location</Text>
                            <View className="h-48 rounded-xl overflow-hidden border border-slate-700 relative">
                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    style={{ flex: 1 }}
                                    initialRegion={{
                                        latitude: offer.location.latitude,
                                        longitude: offer.location.longitude,
                                        latitudeDelta: 0.01,
                                        longitudeDelta: 0.01,
                                    }}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                >
                                    <Marker
                                        coordinate={{
                                            latitude: offer.location.latitude,
                                            longitude: offer.location.longitude,
                                        }}
                                    />
                                </MapView>
                                {/* Overlay to intercept touches if we want it strictly static, or simple block scrolling */}
                                <TouchableOpacity
                                    className="absolute inset-0 bg-transparent"
                                    onPress={() => {
                                        // Maybe open full screen map?
                                    }}
                                />
                            </View>
                        </View>

                    </View>
                </ScrollView>
            </View>
        </GradientBackground>
    );
}
