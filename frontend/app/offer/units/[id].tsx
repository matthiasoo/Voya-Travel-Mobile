import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, useWindowDimensions } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { GradientBackground } from "../../../components/GradientBackground";
import { Offer, AccommodationUnit } from "../../../types/offer";

export default function UnitDetailsScreen() {
    const { id, offerId } = useLocalSearchParams();
    const router = useRouter();
    const { width } = useWindowDimensions();

    const [unit, setUnit] = useState<AccommodationUnit | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!offerId || !id) return;

        const unsubscribe = firestore()
            .collection('offers')
            .doc(offerId as string)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const offerData = doc.data() as Offer;
                    const foundUnit = offerData.details.units.find((u: any) => u.id === id);
                    setUnit(foundUnit || null);
                } else {
                    console.log("No such document!");
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching unit details: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [offerId, id]);

    if (loading) {
        return (
            <GradientBackground variant="full">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#00D4FF" />
                </View>
            </GradientBackground>
        );
    }

    if (!unit) {
        return (
            <GradientBackground variant="full">
                <View className="flex-1 items-center justify-center p-4">
                    <Ionicons name="alert-circle-outline" size={64} color="#64748b" />
                    <Text className="text-white text-xl font-bold mt-4">Unit not found</Text>
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
                <View className="absolute top-0 left-0 right-0 z-10 pt-12 px-4 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full items-center justify-center mr-4"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-bold shadow opacity-90 backdrop-blur-md" numberOfLines={1}>Unit Details</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {/* Images Carousel */}
                    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                        {unit.images && unit.images.length > 0 ? (
                            unit.images.map((img, index) => (
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

                    <View className="px-4 py-6 gap-6">
                        {/* Title & Price */}
                        <View>
                            <Text className="text-2xl font-bold text-white mb-1">{unit.name}</Text>
                            <Text className="text-slate-400 text-sm mb-2">{unit.type.replace(/_/g, ' ')}</Text>

                            <Text className="text-neon-primary text-xl font-bold">
                                $ {unit.pricePerNight} <Text className="text-slate-400 text-sm font-normal">/ night</Text>
                            </Text>
                        </View>

                        {/* Quick Stats */}
                        <View className="flex-row gap-4">
                            <View className="bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-700 items-center flex-1">
                                <Ionicons name="people" size={20} color="#94a3b8" />
                                <Text className="text-slate-400 text-xs mt-1">Capacity</Text>
                                <Text className="text-white font-bold">{unit.capacity.adults} Ad, {unit.capacity.children} Ch</Text>
                            </View>
                            <View className="bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-700 items-center flex-1">
                                <Ionicons name="bed" size={20} color="#94a3b8" />
                                <Text className="text-slate-400 text-xs mt-1">Bed</Text>
                                <Text className="text-white font-bold" numberOfLines={1}>{unit.bedConfiguration || '-'}</Text>
                            </View>
                            <View className="bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-700 items-center flex-1">
                                <Ionicons name="resize" size={20} color="#94a3b8" />
                                <Text className="text-slate-400 text-xs mt-1">Size</Text>
                                <Text className="text-white font-bold">{unit.size > 0 ? `${unit.size} m²` : '-'}</Text>
                            </View>
                        </View>

                        {/* Description */}
                        {unit.unitDescription ? (
                            <View>
                                <Text className="text-lg font-bold text-white mb-2">Description</Text>
                                <Text className="text-slate-300 leading-6">{unit.unitDescription}</Text>
                            </View>
                        ) : null}

                        {/* Amenities */}
                        {unit.amenities && unit.amenities.length > 0 && (
                            <View>
                                <Text className="text-lg font-bold text-white mb-2">Amenities</Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {unit.amenities.map((amenity, index) => (
                                        <View key={index} className="bg-slate-700/50 px-3 py-1 rounded-full border border-slate-600">
                                            <Text className="text-slate-200 text-xs">{amenity}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Inventory */}
                        <View className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-row justify-between items-center">
                            <Text className="text-slate-300">Inventory Quantity</Text>
                            <Text className="text-white font-bold text-lg">{unit.quantity}</Text>
                        </View>

                    </View>
                </ScrollView>
            </View>
        </GradientBackground>
    );
}
