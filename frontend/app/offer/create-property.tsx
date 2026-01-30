import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as geofire from 'geofire-common';
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { Image } from "expo-image";

import { GradientBackground } from "../../components/GradientBackground";
import { GradientInput } from "../../components/GradientInput";
import { GradientButton } from "../../components/GradientButton";
import { uploadImage } from "../../utils/storage";
import { AIService } from "../../services/ai";

export default function CreatePropertyScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [userCategory, setUserCategory] = useState<'ACCOMMODATION' | 'TOURS' | null>(null);

    // Form Fields - offerType will be set based on user category
    const [offerType, setOfferType] = useState<'ACCOMMODATION' | 'TOURS'>('ACCOMMODATION');
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    // Accommodation Specific
    const [propertyType, setPropertyType] = useState<'HOTEL' | 'APARTMENT' | 'HOSTEL'>('HOTEL');
    const [checkInTime, setCheckInTime] = useState("14:00");
    const [checkOutTime, setCheckOutTime] = useState("11:00");
    const [amenitiesInput, setAmenitiesInput] = useState("");

    // Tour Specific
    const [duration, setDuration] = useState("");
    const [maxParticipants, setMaxParticipants] = useState("");
    const [meetingPoint, setMeetingPoint] = useState("");
    const [datesInput, setDatesInput] = useState(""); // Simplified: comma separated dates
    const [whatsIncludedInput, setWhatsIncludedInput] = useState("");
    const [pickupIncluded, setPickupIncluded] = useState(false);
    const [difficulty, setDifficulty] = useState<'EASY' | 'MODERATE' | 'CHALLENGING'>('EASY');
    const [minimumAge, setMinimumAge] = useState("");
    const [languagesInput, setLanguagesInput] = useState("Polski, English");
    const [whatToBringInput, setWhatToBringInput] = useState("");
    const [highlightsInput, setHighlightsInput] = useState("");
    const [transportation, setTransportation] = useState("");
    const [pricePerPerson, setPricePerPerson] = useState("");

    // Map & Location
    const [region, setRegion] = useState<Region>({
        latitude: 51.7592,
        longitude: 19.4560,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    });
    const [markerCoords, setMarkerCoords] = useState({ latitude: 51.7592, longitude: 19.4560 });
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");

    // Images
    const [images, setImages] = useState<string[]>([]);

    // Map Permissions & Initial Reverse Geocode + Fetch User Category
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission to access location was denied');
                return;
            }
            // Initial reverse geocode for default location
            reverseGeocode(markerCoords.latitude, markerCoords.longitude);

            // Fetch user category to lock offer type
            const currentUser = auth().currentUser;
            if (currentUser) {
                const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
                const exists = typeof userDoc.exists === 'function' ? userDoc.exists() : userDoc.exists;
                if (exists) {
                    const userData = userDoc.data();
                    if (userData?.category === 'TOURS') {
                        setUserCategory('TOURS');
                        setOfferType('TOURS');
                    } else if (userData?.category === 'ACCOMMODATION') {
                        setUserCategory('ACCOMMODATION');
                        setOfferType('ACCOMMODATION');
                    }
                }
            }
        })();
    }, []);

    const reverseGeocode = async (latitude: number, longitude: number) => {
        try {
            const locs = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (locs.length > 0) {
                const loc = locs[0];
                setAddress(`${loc.street || ''} ${loc.streetNumber || ''}`.trim());
                setCity(loc.city || loc.subregion || '');
                setCountry(loc.country || '');
            }
        } catch (error) {
            console.log("Reverse geocode error:", error);
        }
    };

    const handleMapPress = (e: any) => {
        const newCoords = e.nativeEvent.coordinate;
        setMarkerCoords(newCoords);
        reverseGeocode(newCoords.latitude, newCoords.longitude);
    };

    const handleGenerateDescription = async () => {
        if (!title || !city) {
            Alert.alert("Missing Info", "Please enter at least a Title and City to generate a description.");
            return;
        }

        setGenerating(true);
        try {
            const desc = await AIService.generateDescription({
                title,
                location: `${city}, ${country}`,
                type: offerType,
                amenities: offerType === 'ACCOMMODATION' ? amenitiesInput.split(',').filter(Boolean) : undefined,
                highlights: offerType === 'TOURS' ? highlightsInput.split(',').filter(Boolean) : undefined
            });
            setDescription(desc);
        } catch (error: any) {
            Alert.alert("AI Generation Failed", error.message);
        } finally {
            setGenerating(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            allowsMultipleSelection: true,
            selectionLimit: 5
        });

        if (!result.canceled) {
            const newUris = result.assets.map(asset => asset.uri);
            setImages(prev => [...prev, ...newUris]);
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title || !description || !address || !city || !country) {
            Alert.alert("Error", "Please fill in all required fields.");
            return;
        }

        if (offerType === 'TOURS' && (!duration || !maxParticipants)) {
            Alert.alert("Error", "Please fill in all tour specific fields.");
            return;
        }

        // AI Safety Check
        setLoading(true);
        try {
            const safetyCheck = await AIService.checkContentSafety(`${title}\n${description}`);
            if (!safetyCheck.safe) {
                Alert.alert("Content Unsafe", `Your offer content was flagged: ${safetyCheck.reason}. Please revise.`);
                setLoading(false);
                return;
            }
        } catch (err) {
            console.error("Safety check failed:", err);
            // Fail open or closed? System prompt says fail open in service, so we might just proceed or log.
            // But here we are inside a try block. If checkContentSafety catches its own errors and returns {safe:true}, we are good.
            // If it throws, we land here.
        }
        try {
            const currentUser = auth().currentUser;
            if (!currentUser) throw new Error("User not logged in");

            // Generate ID first to use in storage path
            const docRef = firestore().collection('offers').doc();
            const offerId = docRef.id;

            // Upload images
            const imageUrls: string[] = [];
            if (images.length > 0) {
                setUploading(true);
                for (const uri of images) {
                    if (uri.startsWith('http')) {
                        imageUrls.push(uri);
                    } else {
                        const url = await uploadImage(`offers/${offerId}/main`, uri);
                        imageUrls.push(url);
                    }
                }
            }

            const geohash = geofire.geohashForLocation([markerCoords.latitude, markerCoords.longitude]);

            const baseData = {
                id: offerId,
                verificationStatus: 'UNVERIFIED' as const,
                providerId: currentUser.uid,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isActive: true,
                title,
                description,
                price: offerType === 'TOURS' ? (parseFloat(pricePerPerson) || 0) : 0, // Simplified price logic
                currency: 'USD',
                images: imageUrls,
                location: {
                    latitude: markerCoords.latitude,
                    longitude: markerCoords.longitude,
                    address,
                    city,
                    country,
                    geohash
                },
                rating: 0,
                reviewsCount: 0,
            };

            let offerData;
            if (offerType === 'ACCOMMODATION') {
                const amenities = amenitiesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
                offerData = {
                    ...baseData,
                    type: 'ACCOMMODATION' as const,
                    details: {
                        propertyType,
                        generalAmenities: amenities,
                        checkInTime,
                        checkOutTime,
                        units: []
                    }
                };
            } else {
                const startDates = datesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
                const whatsIncluded = whatsIncludedInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
                const languages = languagesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
                const whatToBring = whatToBringInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
                const highlights = highlightsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

                offerData = {
                    ...baseData,
                    type: 'TOURS' as const,
                    price: parseFloat(pricePerPerson) || 0,
                    details: {
                        duration: parseFloat(duration) || 1,
                        maxParticipants: parseInt(maxParticipants) || 1,
                        startDates,
                        meetingPoint: meetingPoint || address,
                        pickupIncluded,
                        difficulty,
                        minimumAge: minimumAge ? parseInt(minimumAge) : undefined,
                        languages,
                        whatsIncluded,
                        whatToBring,
                        highlights,
                        transportation: transportation || undefined
                    }
                };
            }

            await docRef.set(offerData);

            Alert.alert("Success", `${offerType === 'TOURS' ? 'Tour' : 'Property'} created successfully!`, [
                { text: "OK", onPress: () => router.back() }
            ]);

        } catch (error: any) {
            console.error("Creation error:", error);
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <GradientBackground variant="full">
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center p-4 pt-12 border-b border-slate-800 bg-slate-900/50">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-white">Create New Offer</Text>
                </View>

                <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                    <View className="gap-6 pb-10">

                        {/* Offer Type Indicator */}
                        <View className={`flex-row items-center gap-3 p-4 rounded-xl border ${offerType === 'TOURS' ? 'bg-neon-primary/10 border-neon-primary/50' : 'bg-neon-secondary/10 border-neon-secondary/50'}`}>
                            <View className={`w-12 h-12 rounded-full items-center justify-center ${offerType === 'TOURS' ? 'bg-neon-primary/20' : 'bg-neon-secondary/20'}`}>
                                <Ionicons
                                    name={offerType === 'TOURS' ? 'compass' : 'bed'}
                                    size={24}
                                    color={offerType === 'TOURS' ? '#00D4FF' : '#7F00FF'}
                                />
                            </View>
                            <View>
                                <Text className="text-slate-400 text-xs">Creating</Text>
                                <Text className={`font-bold text-lg ${offerType === 'TOURS' ? 'text-neon-primary' : 'text-neon-secondary'}`}>
                                    {offerType === 'TOURS' ? 'Tour / Experience' : 'Accommodation'}
                                </Text>
                            </View>
                        </View>

                        {/* Basic Info */}
                        <View className="gap-4">
                            <Text className="text-neon-secondary font-bold text-lg">Basic Information</Text>
                            <GradientInput value={title} onChangeText={setTitle} placeholder="Title (e.g. City Tour or Cozy Apt)" />

                            <View>
                                <View className="flex-row justify-between items-end mb-2">
                                    <Text className="text-slate-400">Description</Text>
                                    <TouchableOpacity
                                        onPress={handleGenerateDescription}
                                        disabled={generating}
                                        className="flex-row items-center gap-1 bg-neon-primary/20 px-2 py-1 rounded-lg border border-neon-primary/50"
                                    >
                                        {generating ? <ActivityIndicator size="small" color="#00D4FF" /> : <Ionicons name="sparkles" size={12} color="#00D4FF" />}
                                        <Text className="text-neon-primary text-xs font-bold">Generate with AI</Text>
                                    </TouchableOpacity>
                                </View>
                                <GradientInput
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder={offerType === 'TOURS' ? "Describe the experience..." : "Describe your property..."}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </View>

                        {/* Images */}
                        <View className="gap-4">
                            <Text className="text-neon-secondary font-bold text-lg">Images</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {images.map((uri, index) => (
                                    <View key={index} className="relative">
                                        <Image source={{ uri }} style={{ width: 100, height: 100, borderRadius: 8 }} contentFit="cover" />
                                        <TouchableOpacity
                                            onPress={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                                        >
                                            <Ionicons name="close" size={12} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity
                                    onPress={pickImage}
                                    className="w-24 h-24 bg-slate-800 rounded-lg border border-slate-700 border-dashed items-center justify-center"
                                >
                                    <Ionicons name="add" size={32} color="#00D4FF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* ACCOMMODATION SPECIFIC */}
                        {offerType === 'ACCOMMODATION' && (
                            <View className="gap-4">
                                <Text className="text-neon-secondary font-bold text-lg">Accommodation Details</Text>

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-slate-400 mb-2">Check-in</Text>
                                        <GradientInput value={checkInTime} onChangeText={setCheckInTime} placeholder="14:00" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-400 mb-2">Check-out</Text>
                                        <GradientInput value={checkOutTime} onChangeText={setCheckOutTime} placeholder="11:00" />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-slate-400 mb-2">Amenities</Text>
                                    <GradientInput value={amenitiesInput} onChangeText={setAmenitiesInput} placeholder="Wifi, Pool, Gym (comma separated)" />
                                </View>
                            </View>
                        )}

                        {/* TOURS SPECIFIC */}
                        {offerType === 'TOURS' && (
                            <View className="gap-4">
                                <Text className="text-neon-primary font-bold text-lg">Tour Details</Text>

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-slate-400 mb-2">Duration (h)</Text>
                                        <GradientInput value={duration} onChangeText={setDuration} keyboardType="numeric" placeholder="e.g. 5" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-400 mb-2">Max Participants</Text>
                                        <GradientInput value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" placeholder="e.g. 10" />
                                    </View>
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-slate-400 mb-2">Price per Person</Text>
                                        <GradientInput value={pricePerPerson} onChangeText={setPricePerPerson} keyboardType="numeric" placeholder="50.00" icon={<Text className="text-slate-400 ml-2">$</Text>} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-400 mb-2">Min. Age</Text>
                                        <GradientInput value={minimumAge} onChangeText={setMinimumAge} keyboardType="numeric" placeholder="e.g. 12" />
                                    </View>
                                </View>

                                {/* Difficulty Selector */}
                                <View>
                                    <Text className="text-slate-400 mb-2">Difficulty</Text>
                                    <View className="flex-row gap-2">
                                        {(['EASY', 'MODERATE', 'CHALLENGING'] as const).map((level) => (
                                            <TouchableOpacity
                                                key={level}
                                                onPress={() => setDifficulty(level)}
                                                className={`flex-1 p-3 rounded-lg border ${difficulty === level ? 'bg-neon-primary/20 border-neon-primary' : 'bg-slate-800 border-slate-700'}`}
                                            >
                                                <Text className={`text-center font-bold ${difficulty === level ? 'text-neon-primary' : 'text-slate-400'}`}>
                                                    {level}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-slate-400 mb-2">Languages</Text>
                                    <GradientInput value={languagesInput} onChangeText={setLanguagesInput} placeholder="English, Spanish, Polish..." />
                                </View>

                                {/* Pickup Toggle */}
                                <TouchableOpacity
                                    onPress={() => setPickupIncluded(!pickupIncluded)}
                                    className={`flex-row items-center justify-between p-4 rounded-xl border ${pickupIncluded ? 'bg-neon-primary/10 border-neon-primary' : 'bg-slate-800 border-slate-700'}`}
                                >
                                    <View className="flex-row items-center gap-3">
                                        <Ionicons name="car" size={24} color={pickupIncluded ? '#00D4FF' : '#94a3b8'} />
                                        <View>
                                            <Text className={pickupIncluded ? 'text-neon-primary font-bold' : 'text-slate-400'}>Pickup Included</Text>
                                            <Text className="text-slate-500 text-xs">Is hotel pickup provided?</Text>
                                        </View>
                                    </View>
                                    <Ionicons name={pickupIncluded ? "checkmark-circle" : "ellipse-outline"} size={24} color={pickupIncluded ? '#00D4FF' : '#94a3b8'} />
                                </TouchableOpacity>

                                <View>
                                    <Text className="text-slate-400 mb-2">Meeting Point</Text>
                                    <GradientInput value={meetingPoint} onChangeText={setMeetingPoint} placeholder="Where the tour starts" />
                                </View>

                                <View>
                                    <Text className="text-slate-400 mb-2">Transportation</Text>
                                    <GradientInput value={transportation} onChangeText={setTransportation} placeholder="e.g. Minivan, Boat, Walking..." />
                                </View>

                                <View>
                                    <Text className="text-slate-400 mb-2">What's Included</Text>
                                    <GradientInput value={whatsIncludedInput} onChangeText={setWhatsIncludedInput} placeholder="Lunch, Equipment, Tickets..." />
                                </View>

                                <View>
                                    <Text className="text-slate-400 mb-2">What to Bring</Text>
                                    <GradientInput value={whatToBringInput} onChangeText={setWhatToBringInput} placeholder="Sunscreen, Water, Towel..." />
                                </View>

                                <View>
                                    <Text className="text-slate-400 mb-2">Highlights</Text>
                                    <GradientInput value={highlightsInput} onChangeText={setHighlightsInput} placeholder="Key sights (comma separated)" />
                                </View>
                            </View>
                        )}

                        {/* Location */}
                        <View className="gap-4">
                            <Text className="text-white font-bold text-lg">Location</Text>

                            <View className="h-48 rounded-xl overflow-hidden border border-slate-700">
                                <MapView
                                    style={{ flex: 1 }}
                                    region={region}
                                    onRegionChangeComplete={(reg) => {
                                        setRegion(reg);
                                        setMarkerCoords({ latitude: reg.latitude, longitude: reg.longitude });
                                    }}
                                    onPress={handleMapPress}
                                    provider={PROVIDER_GOOGLE}
                                >
                                    <Marker coordinate={markerCoords} />
                                </MapView>
                            </View>

                            <GradientInput value={address} onChangeText={setAddress} placeholder="Street Address" />
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <GradientInput value={city} onChangeText={setCity} placeholder="City" />
                                </View>
                                <View className="flex-1">
                                    <GradientInput value={country} onChangeText={setCountry} placeholder="Country" />
                                </View>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <View className="mt-4">
                            {loading || uploading ? (
                                <View className="items-center">
                                    <ActivityIndicator size="large" color="#00D4FF" />
                                    {uploading && <Text className="text-slate-400 mt-2">Uploading images...</Text>}
                                </View>
                            ) : (
                                <GradientButton
                                    onPress={handleSubmit}
                                    title={`Create ${offerType === 'ACCOMMODATION' ? 'Property' : 'Tour'}`}
                                />
                            )}
                        </View>

                    </View>
                </ScrollView>
            </View>
        </GradientBackground>
    );
}
