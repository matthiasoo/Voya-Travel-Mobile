import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, useWindowDimensions } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { GradientBackground } from "../../components/GradientBackground";
import { Offer } from "../../types/offer";
import { createChat } from "../../services/chat";
import { BookingSection } from "../../components/BookingSection";
import { ReviewsList } from "../../components/ReviewsList";
import { useAccessibility } from "../../contexts/AccessibilityContext";
import { ReportModal } from "../../components/ReportModal";

export default function OfferDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const currentUser = auth().currentUser;
    const { isHighContrast } = useAccessibility();

    const [offer, setOffer] = useState<Offer | null>(null);
    const [loading, setLoading] = useState(true);
    const [reportModalVisible, setReportModalVisible] = useState(false);

    useEffect(() => {
        if (!id) return;

        const unsubscribe = firestore()
            .collection('offers')
            .doc(id as string)
            .onSnapshot((doc) => {
                
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
                    <ActivityIndicator size="large" color={isHighContrast ? "#FACC15" : "#00D4FF"} />
                </View>
            </GradientBackground>
        );
    }

    if (!offer) {
        return (
            <GradientBackground variant="full">
                <View className="flex-1 items-center justify-center p-4">
                    <Ionicons name="alert-circle-outline" size={64} color={isHighContrast ? "#d1d5db" : "#64748b"} />
                    <Text className="text-white text-xl font-bold mt-4">Offer not found</Text>
                    <TouchableOpacity onPress={() => router.back()} className={`mt-4 p-3 rounded-lg ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-800'}`}>
                        <Text className="text-white font-bold">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground variant="full">
            <View className="flex-1">
                {}
                <View className="absolute top-0 left-0 right-0 z-10 pt-12 px-4 flex-row justify-between items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className={`w-10 h-10 rounded-full items-center justify-center ${isHighContrast
                            ? 'bg-black/80 border border-white'
                            : 'bg-black/30 backdrop-blur-md'
                            }`}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    {}
                    {}
                    {currentUser?.uid === offer.providerId ? (
                        <View className="flex-row items-center gap-2">
                            <TouchableOpacity
                                onPress={() => router.push(`/offer/edit?id=${offer.id}`)}
                                className={`w-10 h-10 rounded-full items-center justify-center border ${isHighContrast
                                    ? 'bg-black/80 border-white'
                                    : 'bg-black/30 backdrop-blur-md border-slate-700'
                                    }`}
                            >
                                <Ionicons name="pencil" size={20} color="white" />
                            </TouchableOpacity>

                            <View className={`px-3 py-1 rounded-full border ${isHighContrast ? 'bg-black/80' : 'bg-black/30 backdrop-blur-md'
                                } ${offer.verificationStatus === 'VERIFIED' ? 'border-green-500' :
                                    offer.verificationStatus === 'REJECTED' ? 'border-red-500' :
                                        'border-yellow-500'
                                }`}>
                                <Text className={`text-xs font-bold ${offer.verificationStatus === 'VERIFIED' ? 'text-green-400' :
                                    offer.verificationStatus === 'REJECTED' ? 'text-red-400' :
                                        'text-yellow-400'
                                    }`}>
                                    {offer.verificationStatus}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setReportModalVisible(true)}
                            className={`w-10 h-10 rounded-full items-center justify-center ${isHighContrast
                                ? 'bg-black/80 border border-red-500'
                                : 'bg-black/30 backdrop-blur-md'
                                }`}
                        >
                            <Ionicons name="flag-outline" size={20} color={isHighContrast ? "#ef4444" : "white"} />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    {}
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
                            <View style={{ width, height: 300 }} className={`items-center justify-center ${isHighContrast ? 'bg-neutral-900' : 'bg-slate-800'}`}>
                                <Ionicons name="image-outline" size={64} color={isHighContrast ? "#9CA3AF" : "#475569"} />
                                <Text className={isHighContrast ? "text-white mt-2" : "text-slate-500 mt-2"}>No images available</Text>
                            </View>
                        )}
                    </ScrollView>

                    {}
                    <View className="px-4 py-6 gap-6">

                        {}
                        <View>
                            <Text className="text-2xl font-bold text-white mb-2">{offer.title}</Text>
                            <Text className={`text-xl font-bold ${isHighContrast ? 'text-white' : 'text-neon-primary'}`}>
                                <Text className={`text-sm font-normal ${isHighContrast ? 'text-white' : 'text-slate-400'}`}>from</Text> {offer.currency} {offer.price} <Text className={`text-sm font-normal ${isHighContrast ? 'text-white' : 'text-slate-400'}`}>/ {offer.type === 'TOURS' ? 'person' : 'night'}</Text>
                            </Text>

                            <View className="flex-row items-center gap-1 mt-2">
                                <Ionicons name="location" size={16} color={isHighContrast ? "white" : "#94a3b8"} />
                                <Text className={isHighContrast ? "text-white" : "text-slate-300"}>{offer.location.address}, {offer.location.city}, {offer.location.country}</Text>
                            </View>
                        </View>

                        {}
                        <View>
                            <Text className="text-lg font-bold text-white mb-2">About</Text>
                            <Text className={`leading-6 ${isHighContrast ? 'text-white' : 'text-slate-300'}`}>{offer.description}</Text>
                        </View>

                        {}
                        {currentUser?.uid !== offer.providerId && (
                            <View className="mb-4">
                                <TouchableOpacity
                                    onPress={async () => {
                                        try {
                                            setLoading(true);
                                            
                                            let providerName = "Host";
                                            try {
                                                const providerDoc = await firestore().collection('users').doc(offer.providerId).get();
                                                if (providerDoc.exists) {
                                                    const exists = typeof providerDoc.exists === 'function' ? providerDoc.exists() : providerDoc.exists;
                                                    if (exists) {
                                                        const potentialName = providerDoc.data()?.fullName;
                                                        if (potentialName) providerName = potentialName;
                                                    }
                                                }
                                            } catch (err) {
                                                console.warn("Could not fetch provider name:", err);
                                            }

                                            const chatId = await createChat(
                                                offer.id,
                                                offer.title,
                                                offer.providerId,
                                                providerName
                                            );
                                            setLoading(false);
                                            router.push({ pathname: '/chat/[id]', params: { id: chatId } });
                                        } catch (e) {
                                            console.error("Error starting chat:", e);
                                            setLoading(false);
                                        }
                                    }}
                                    className={`p-3 rounded-xl flex-row items-center justify-center w-full ${isHighContrast ? 'bg-yellow-400' : 'bg-neon-primary'
                                        }`}
                                >
                                    <Ionicons name="chatbubbles" size={20} color={isHighContrast ? "black" : "white"} />
                                    <Text className={`font-bold ml-2 ${isHighContrast ? 'text-black' : 'text-white'}`}>Chat with {offer.type === 'TOURS' ? 'Guide' : 'Host'}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => router.push({ pathname: '/users/[id]', params: { id: offer.providerId } })}
                                    className={`mt-3 p-3 rounded-xl flex-row items-center justify-center w-full border ${isHighContrast ? 'bg-black border-white' : 'bg-slate-800 border-slate-700'}`}
                                >
                                    <Ionicons name="person" size={20} color={isHighContrast ? "white" : "#94a3b8"} />
                                    <Text className={`font-bold ml-2 ${isHighContrast ? 'text-white' : 'text-slate-300'}`}>View Provider Profile</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <View className={`p-4 rounded-xl border gap-4 ${isHighContrast
                            ? 'bg-black border-2 border-white'
                            : 'bg-slate-800/50 border-slate-700'
                            }`}>
                            <View className="flex-row justify-between items-center">
                                <Text className="text-lg font-bold text-white">Details</Text>
                                {currentUser?.uid === offer.providerId && offer.type === 'ACCOMMODATION' && (
                                    <TouchableOpacity
                                        onPress={() => router.push(`/offer/create-unit?offerId=${id}`)}
                                        className={`flex-row items-center px-3 py-1 rounded-full border ${isHighContrast
                                            ? 'bg-white border-white'
                                            : 'bg-neon-primary/20 border-neon-primary/50'
                                            }`}
                                    >
                                        <Ionicons name="add" size={16} color={isHighContrast ? "black" : "#7F00FF"} />
                                        <Text className={`font-bold text-xs ml-1 ${isHighContrast ? 'text-black' : 'text-neon-primary'}`}>Add Unit</Text>
                                    </TouchableOpacity>
                                )}
                            </View>


                            {offer.type === 'ACCOMMODATION' ? (
                                <>
                                    <View className="flex-row flex-wrap gap-4">
                                        <View className={`px-3 py-2 rounded-lg ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-900'}`}>
                                            <Text className={isHighContrast ? "text-white text-xs" : "text-slate-400 text-xs"}>Type</Text>
                                            <Text className="text-white font-bold">{offer.details.propertyType}</Text>
                                        </View>
                                        <View className={`px-3 py-2 rounded-lg ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-900'}`}>
                                            <Text className={isHighContrast ? "text-white text-xs" : "text-slate-400 text-xs"}>Check-in</Text>
                                            <Text className="text-white font-bold">{offer.details.checkInTime}</Text>
                                        </View>
                                        <View className={`px-3 py-2 rounded-lg ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-900'}`}>
                                            <Text className={isHighContrast ? "text-white text-xs" : "text-slate-400 text-xs"}>Check-out</Text>
                                            <Text className="text-white font-bold">{offer.details.checkOutTime}</Text>
                                        </View>
                                    </View>
                                    <View>
                                        <Text className={`text-sm mb-2 ${isHighContrast ? 'text-white font-bold' : 'text-slate-400'}`}>Amenities</Text>
                                        <View className="flex-row flex-wrap gap-2">
                                            {offer.details.generalAmenities.map((amenity, index) => (
                                                <View key={index} className={`px-3 py-1 rounded-full ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-700/50'
                                                    }`}>
                                                    <Text className={`text-xs ${isHighContrast ? 'text-white font-bold' : 'text-slate-200'}`}>{amenity}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <>
                                    {}
                                    <View className="flex-row flex-wrap gap-4">
                                        <View className={`px-3 py-2 rounded-lg ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-900'}`}>
                                            <Text className={isHighContrast ? "text-white text-xs" : "text-slate-400 text-xs"}>Duration</Text>
                                            <Text className="text-white font-bold">{offer.details.duration}h</Text>
                                        </View>
                                        <View className={`px-3 py-2 rounded-lg ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-900'}`}>
                                            <Text className={isHighContrast ? "text-white text-xs" : "text-slate-400 text-xs"}>Max People</Text>
                                            <Text className="text-white font-bold">{offer.details.maxParticipants}</Text>
                                        </View>
                                        {offer.details.difficulty && (
                                            <View className={`px-3 py-2 rounded-lg ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-900'}`}>
                                                <Text className={isHighContrast ? "text-white text-xs" : "text-slate-400 text-xs"}>Difficulty</Text>
                                                <Text className="text-white font-bold">{offer.details.difficulty}</Text>
                                            </View>
                                        )}
                                        {offer.details.minimumAge && (
                                            <View className={`px-3 py-2 rounded-lg ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-900'}`}>
                                                <Text className={isHighContrast ? "text-white text-xs" : "text-slate-400 text-xs"}>Min. Age</Text>
                                                <Text className="text-white font-bold">{offer.details.minimumAge}+</Text>
                                            </View>
                                        )}
                                    </View>

                                    {}
                                    {offer.details.meetingPoint && (
                                        <View>
                                            <Text className={`text-sm mb-2 ${isHighContrast ? 'text-white font-bold' : 'text-slate-400'}`}>Meeting Point</Text>
                                            <View className="flex-row items-center gap-2">
                                                <Ionicons name="location" size={16} color={isHighContrast ? "white" : "#00D4FF"} />
                                                <Text className="text-white font-bold">{offer.details.meetingPoint}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {}
                                    {offer.details.pickupIncluded && (
                                        <View className={`flex-row items-center gap-2 px-3 py-2 rounded-lg ${isHighContrast
                                            ? 'bg-neutral-800 border border-green-400'
                                            : 'bg-green-500/20'
                                            }`}>
                                            <Ionicons name="car" size={16} color={isHighContrast ? "#4ade80" : "#4ade80"} />
                                            <Text className="text-green-400 font-bold text-sm">Hotel pickup included</Text>
                                        </View>
                                    )}

                                    {}
                                    {offer.details.transportation && (
                                        <View>
                                            <Text className={`text-sm mb-2 ${isHighContrast ? 'text-white font-bold' : 'text-slate-400'}`}>Transportation</Text>
                                            <Text className="text-white">{offer.details.transportation}</Text>
                                        </View>
                                    )}

                                    {}
                                    {offer.details.languages && offer.details.languages.length > 0 && (
                                        <View>
                                            <Text className={`text-sm mb-2 ${isHighContrast ? 'text-white font-bold' : 'text-slate-400'}`}>Languages</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {offer.details.languages.map((lang, index) => (
                                                    <View key={index} className={`px-3 py-1 rounded-full border ${isHighContrast
                                                        ? 'bg-neutral-800 border-white'
                                                        : 'bg-blue-500/20 border-blue-500/50'
                                                        }`}>
                                                        <Text className={`text-xs font-bold ${isHighContrast ? 'text-white' : 'text-blue-400'}`}>{lang}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {}
                                    {offer.details.highlights && offer.details.highlights.length > 0 && (
                                        <View>
                                            <Text className={`text-sm mb-2 ${isHighContrast ? 'text-white font-bold' : 'text-slate-400'}`}>Highlights</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {offer.details.highlights.map((item, index) => (
                                                    <View key={index} className={`px-3 py-1 rounded-full border ${isHighContrast
                                                        ? 'bg-neutral-800 border-white'
                                                        : 'bg-neon-primary/20 border-neon-primary/50'
                                                        }`}>
                                                        <Text className={`text-xs font-bold ${isHighContrast ? 'text-white' : 'text-neon-primary'}`}>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {}
                                    {offer.details.whatsIncluded && offer.details.whatsIncluded.length > 0 && (
                                        <View>
                                            <Text className={`text-sm mb-2 ${isHighContrast ? 'text-white font-bold' : 'text-slate-400'}`}>What's Included</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {offer.details.whatsIncluded.map((item, index) => (
                                                    <View key={index} className={`px-3 py-1 rounded-full border ${isHighContrast
                                                        ? 'bg-neutral-800 border-white'
                                                        : 'bg-green-500/20 border-green-500/50'
                                                        }`}>
                                                        <Text className={`text-xs ${isHighContrast ? 'text-white font-bold' : 'text-green-400'}`}>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}

                                    {}
                                    {offer.details.whatToBring && offer.details.whatToBring.length > 0 && (
                                        <View>
                                            <Text className={`text-sm mb-2 ${isHighContrast ? 'text-white font-bold' : 'text-slate-400'}`}>What to Bring</Text>
                                            <View className="flex-row flex-wrap gap-2">
                                                {offer.details.whatToBring.map((item, index) => (
                                                    <View key={index} className={`px-3 py-1 rounded-full border ${isHighContrast
                                                        ? 'bg-neutral-800 border-white'
                                                        : 'bg-yellow-500/20 border-yellow-500/50'
                                                        }`}>
                                                        <Text className={`text-xs ${isHighContrast ? 'text-white font-bold' : 'text-yellow-400'}`}>{item}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>

                        {}
                        {offer.type === 'ACCOMMODATION' && (
                            <View>
                                <Text className="text-lg font-bold text-white mb-4">Units</Text>
                                {offer.details.units && offer.details.units.length > 0 ? (
                                    <View className="gap-4">
                                        {offer.details.units.map((unit, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => router.push({ pathname: "/offer/units/[id]", params: { id: unit.id, offerId: offer.id } })}
                                                className={`rounded-xl overflow-hidden border flex-row ${isHighContrast
                                                    ? 'bg-black border-2 border-white'
                                                    : 'bg-slate-800/90 border-slate-700'
                                                    }`}
                                            >
                                                <Image
                                                    source={{ uri: unit.images?.[0] }}
                                                    style={{ width: 100, height: 100 }}
                                                    contentFit="cover"
                                                />
                                                <View className="flex-1 p-3 justify-between">
                                                    <View>
                                                        <Text className="text-white font-bold text-lg" numberOfLines={1}>{unit.name}</Text>
                                                        <Text className={isHighContrast ? "text-white text-xs" : "text-slate-400 text-xs"}>{unit.type.replace(/_/g, ' ')}</Text>
                                                    </View>
                                                    <View className="flex-row justify-between items-end">
                                                        <View>
                                                            <Text className={`font-bold ${isHighContrast ? 'text-white' : 'text-neon-primary'}`}>{offer.currency} {unit.pricePerNight}</Text>
                                                            <Text className={isHighContrast ? "text-white text-xs" : "text-slate-500 text-xs"}>per night</Text>
                                                        </View>
                                                        <View className="flex-row gap-2">
                                                            <View className={`flex-row items-center gap-1 px-2 py-1 rounded ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-700/50'
                                                                }`}>
                                                                <Ionicons name="people" size={12} color={isHighContrast ? "white" : "#94a3b8"} />
                                                                <Text className={isHighContrast ? "text-white text-xs" : "text-slate-300 text-xs"}>{unit.capacity.adults}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : (
                                    <Text className={isHighContrast ? "text-white italic" : "text-slate-500 italic"}>No units added yet.</Text>
                                )}
                            </View>
                        )}

                        {}
                        <View>
                            <Text className="text-lg font-bold text-white mb-4">Location</Text>
                            <View className={`h-48 rounded-xl overflow-hidden border relative ${isHighContrast ? 'border-2 border-white bg-black' : 'border-slate-700'
                                }`}>
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
                                    customMapStyle={isHighContrast ? [
                                        { elementType: "geometry", stylers: [{ color: "#000000" }] },
                                        { elementType: "labels.text.fill", stylers: [{ color: "#ffffff" }] },
                                        { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
                                        { featureType: "road", elementType: "geometry", stylers: [{ color: "#4a4a4a" }] },
                                        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a0a2a" }] },
                                    ] : undefined}
                                >
                                    <Marker
                                        coordinate={{
                                            latitude: offer.location.latitude,
                                            longitude: offer.location.longitude,
                                        }}
                                    />
                                </MapView>
                                {}
                                <TouchableOpacity
                                    className="absolute inset-0 bg-transparent"
                                    onPress={() => {
                                        
                                    }}
                                />
                            </View>
                        </View>

                        {}
                        <View>
                            <ReviewsList offerId={offer.id} />
                        </View>

                        <BookingSection offer={offer} />

                    </View>
                </ScrollView>
                {offer && (
                    <ReportModal
                        visible={reportModalVisible}
                        onClose={() => setReportModalVisible(false)}
                        targetId={offer.id}
                        targetType="OFFER"
                        targetName={offer.title}
                    />
                )}
            </View>
        </GradientBackground>
    );
}

