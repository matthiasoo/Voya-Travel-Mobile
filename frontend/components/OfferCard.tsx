import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Offer, VerificationStatus } from "../types/offer";
import { useAccessibility } from "../contexts/AccessibilityContext";

interface OfferCardProps {
    offer: Offer;
    showStatus?: boolean; 
    showType?: boolean; 
}

export function OfferCard({ offer, showStatus = false, showType = true }: OfferCardProps) {
    const router = useRouter();
    const { isHighContrast } = useAccessibility();

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
            className={`rounded-xl border mb-4 overflow-hidden ${isHighContrast
                ? 'bg-black border-2 border-white'
                : 'bg-slate-800/80 border-slate-700'
                }`}
        >
            {}
            {showStatus && (
                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        router.push(`/offer/edit?id=${offer.id}`);
                    }}
                    className={`absolute top-2 right-2 z-10 p-2 rounded-full border ${isHighContrast
                        ? 'bg-black border-white'
                        : 'bg-slate-900/90 border-slate-700'
                        }`}
                >
                    <Ionicons name="pencil" size={16} color="white" />
                </TouchableOpacity>
            )}

            {}
            <View className={`h-44 w-full relative ${isHighContrast ? 'bg-neutral-900' : 'bg-slate-900'}`}>
                {offer.images && offer.images.length > 0 ? (
                    <Image
                        source={{ uri: offer.images[0] }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={500}
                    />
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="image-outline" size={48} color={isHighContrast ? "#666" : "#64748B"} />
                    </View>
                )}

                {}
                <View className={`absolute bottom-2 right-2 px-3 py-1.5 rounded-lg ${isHighContrast ? 'bg-black border border-white' : 'bg-slate-900/90'
                    }`}>
                    <Text className={`font-bold ${isHighContrast ? 'text-white' : 'text-neon-primary'}`}>
                        <Text className={`text-xs font-normal ${isHighContrast ? 'text-white' : 'text-slate-400'}`}>from </Text>
                        {offer.currency} {offer.price}
                        <Text className={`text-xs font-normal ${isHighContrast ? 'text-white' : 'text-slate-400'}`}> / {offer.type === 'TOURS' ? 'person' : 'night'}</Text>
                    </Text>
                </View>

                {}
                {showType && offer.type === 'TOURS' && (
                    <View className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg flex-row items-center gap-1 ${isHighContrast ? 'bg-yellow-400' : 'bg-neon-primary/90'
                        }`}>
                        <Ionicons name="compass" size={12} color={isHighContrast ? "black" : "white"} />
                        <Text className={`text-xs font-bold ${isHighContrast ? 'text-black' : 'text-white'}`}>TOUR</Text>
                    </View>
                )}
                {showType && offer.type === 'ACCOMMODATION' && (
                    <View className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg flex-row items-center gap-1 ${isHighContrast ? 'bg-cyan-400' : 'bg-neon-secondary/90'
                        }`}>
                        <Ionicons name="bed" size={12} color={isHighContrast ? "black" : "white"} />
                        <Text className={`text-xs font-bold ${isHighContrast ? 'text-black' : 'text-white'}`}>STAY</Text>
                    </View>
                )}
            </View>

            {}
            <View className="p-4">
                <Text className="text-lg font-bold text-white mb-1" numberOfLines={1}>
                    {offer.title}
                </Text>

                <View className="flex-row items-center gap-1 mb-3">
                    <Ionicons name="location-outline" size={14} color={isHighContrast ? "white" : "#94A3B8"} />
                    <Text className={`text-sm ${isHighContrast ? 'text-white font-medium' : 'text-slate-400'}`}>
                        {offer.location.city}, {offer.location.country}
                    </Text>
                </View>

                {}
                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-1">
                        <Ionicons name="star" size={14} color={isHighContrast ? "white" : "#FBBF24"} />
                        <Text className={`text-sm font-bold ${isHighContrast ? 'text-white' : 'text-yellow-500'}`}>
                            {offer.rating > 0 ? offer.rating.toFixed(1) : 'New'}
                        </Text>
                        {offer.reviewsCount > 0 && (
                            <Text className={`text-xs ${isHighContrast ? 'text-white' : 'text-slate-500'}`}>({offer.reviewsCount})</Text>
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

