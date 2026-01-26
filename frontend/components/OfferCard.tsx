import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Offer, VerificationStatus } from "../types/offer";

interface OfferCardProps {
    offer: Offer;
    showStatus?: boolean; // For provider view
    showType?: boolean; // Show TOUR/ACCOMMODATION badge
}

export function OfferCard({ offer, showStatus = false, showType = true }: OfferCardProps) {
    const router = useRouter();

    const getStatusColor = (status: VerificationStatus) => {
        switch (status) {
            case 'VERIFIED': return 'text-green-400 border-green-500/50 bg-green-500/10';
            case 'REJECTED': return 'text-red-400 border-red-500/50 bg-red-500/10';
            case 'UNVERIFIED': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
            default: return 'text-gray-400';
        }
    };

    return (
        <TouchableOpacity
            onPress={() => router.push(`/offer/${offer.id}`)}
            className="bg-slate-800/80 rounded-xl border border-slate-700 mb-4 overflow-hidden"
        >
            {/* Image Section */}
            <View className="h-44 w-full bg-slate-900 relative">
                {offer.images && offer.images.length > 0 ? (
                    <Image
                        source={{ uri: offer.images[0] }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={500}
                    />
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="image-outline" size={48} color="#64748B" />
                    </View>
                )}

                {/* Price Badge */}
                <View className="absolute bottom-2 right-2 bg-slate-900/90 px-3 py-1.5 rounded-lg">
                    <Text className="text-neon-primary font-bold">
                        <Text className="text-slate-400 text-xs font-normal">from </Text>
                        {offer.currency} {offer.price}
                        <Text className="text-slate-400 text-xs font-normal"> / {offer.type === 'TOURS' ? 'person' : 'night'}</Text>
                    </Text>
                </View>

                {/* Type Badge */}
                {showType && offer.type === 'TOURS' && (
                    <View className="absolute top-2 left-2 bg-neon-primary/90 px-2.5 py-1 rounded-lg flex-row items-center gap-1">
                        <Ionicons name="compass" size={12} color="white" />
                        <Text className="text-white text-xs font-bold">TOUR</Text>
                    </View>
                )}
                {showType && offer.type === 'ACCOMMODATION' && (
                    <View className="absolute top-2 left-2 bg-neon-secondary/90 px-2.5 py-1 rounded-lg flex-row items-center gap-1">
                        <Ionicons name="bed" size={12} color="white" />
                        <Text className="text-white text-xs font-bold">STAY</Text>
                    </View>
                )}
            </View>

            {/* Content Section */}
            <View className="p-4">
                <Text className="text-lg font-bold text-white mb-1" numberOfLines={1}>
                    {offer.title}
                </Text>

                <View className="flex-row items-center gap-1 mb-3">
                    <Ionicons name="location-outline" size={14} color="#94A3B8" />
                    <Text className="text-slate-400 text-sm">
                        {offer.location.city}, {offer.location.country}
                    </Text>
                </View>

                {/* Bottom Row: Rating + Status/Date */}
                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-1">
                        <Ionicons name="star" size={14} color="#FBBF24" />
                        <Text className="text-yellow-500 text-sm font-bold">
                            {offer.rating > 0 ? offer.rating.toFixed(1) : 'New'}
                        </Text>
                        {offer.reviewsCount > 0 && (
                            <Text className="text-slate-500 text-xs">({offer.reviewsCount})</Text>
                        )}
                    </View>

                    {showStatus && (
                        <View className={`px-2 py-1 rounded border ${getStatusColor(offer.verificationStatus).split(' ')[1]} ${getStatusColor(offer.verificationStatus).split(' ')[2]}`}>
                            <Text className={`text-xs font-bold ${getStatusColor(offer.verificationStatus).split(' ')[0]}`}>
                                {offer.verificationStatus}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}
