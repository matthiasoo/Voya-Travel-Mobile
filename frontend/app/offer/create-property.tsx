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

export default function CreatePropertyScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
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
                if (userDoc.exists) {
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

    const handleDragEnd = (e: any) => {
        const newCoords = e.nativeEvent.coordinate;
        setMarkerCoords(newCoords);
        reverseGeocode(newCoords.latitude, newCoords.longitude);
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

        setLoading(true);
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
                price: 0,
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

                        {/* Offer Type - Styled indicator */}
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
                            <GradientInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Description"
                                multiline
                                numberOfLines={4}
                            />
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

                        {/* CONDITIONAL DETAILS */}
                        {offerType === 'ACCOMMODATION' ? (
                            <View className="gap-4">
                                <Text className="text-neon-secondary font-bold text-lg">Accommodation Details</Text>

                                <Text className="text-gray-400 ml-1">Property Type</Text>
                                <View className="flex-row gap-2">
                                    {(['HOTEL', 'APARTMENT', 'HOSTEL'] as const).map(t => (
                                        <TouchableOpacity
                                            key={t}
                                            onPress={() => setPropertyType(t)}
                                            className={`px-4 py-2 rounded-lg border ${propertyType === t ? 'bg-neon-primary border-neon-primary' : 'bg-slate-800 border-slate-600'}`}
                                        >
                                            <Text className={`font-bold ${propertyType === t ? 'text-black' : 'text-gray-300'}`}>{t}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-gray-400 ml-1 mb-1">Check-in</Text>
                                        <GradientInput value={checkInTime} onChangeText={setCheckInTime} placeholder="14:00" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 ml-1 mb-1">Check-out</Text>
                                        <GradientInput value={checkOutTime} onChangeText={setCheckOutTime} placeholder="11:00" />
                                    </View>
                                </View>

                                <Text className="text-gray-400 ml-1">Amenities (comma separated)</Text>
                                <GradientInput
                                    value={amenitiesInput}
                                    onChangeText={setAmenitiesInput}
                                    placeholder="Wifi, Pool, Parking..."
                                />
                            </View>
                        ) : (
                            <View className="gap-4">
                                <Text className="text-neon-secondary font-bold text-lg">Tour Details</Text>

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-gray-400 ml-1 mb-1">Duration (hours)</Text>
                                        <GradientInput value={duration} onChangeText={setDuration} placeholder="e.g. 2.5" keyboardType="numeric" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 ml-1 mb-1">Max People</Text>
                                        <GradientInput value={maxParticipants} onChangeText={setMaxParticipants} placeholder="e.g. 15" keyboardType="numeric" />
                                    </View>
                                </View>

                                <View className="flex-row gap-4">
                                    <View className="flex-1">
                                        <Text className="text-gray-400 ml-1 mb-1">Price per Person</Text>
                                        <GradientInput value={pricePerPerson} onChangeText={setPricePerPerson} placeholder="e.g. 50" keyboardType="numeric" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-400 ml-1 mb-1">Min. Age</Text>
                                        <GradientInput value={minimumAge} onChangeText={setMinimumAge} placeholder="e.g. 12" keyboardType="numeric" />
                                    </View>
                                </View>

                                <Text className="text-gray-400 ml-1">Difficulty</Text>
                                <View className="flex-row gap-2">
                                    {(['EASY', 'MODERATE', 'CHALLENGING'] as const).map(d => (
                                        <TouchableOpacity
                                            key={d}
                                            onPress={() => setDifficulty(d)}
                                            className={`flex-1 py-2 rounded-lg border items-center ${difficulty === d ? 'bg-neon-primary border-neon-primary' : 'bg-slate-800 border-slate-600'}`}
                                        >
                                            <Text className={`font-bold text-sm ${difficulty === d ? 'text-black' : 'text-gray-300'}`}>{d}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text className="text-gray-400 ml-1">Meeting Point</Text>
                                <GradientInput
                                    value={meetingPoint}
                                    onChangeText={setMeetingPoint}
                                    placeholder="e.g. Main Square Fountain"
                                />

                                <TouchableOpacity
                                    onPress={() => setPickupIncluded(!pickupIncluded)}
                                    className="flex-row items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700"
                                >
                                    <View className={`w-6 h-6 rounded border-2 items-center justify-center ${pickupIncluded ? 'bg-neon-primary border-neon-primary' : 'border-slate-500'}`}>
                                        {pickupIncluded && <Ionicons name="checkmark" size={16} color="black" />}
                                    </View>
                                    <Text className="text-white">Hotel pickup included</Text>
                                </TouchableOpacity>

                                <Text className="text-gray-400 ml-1">Transportation</Text>
                                <GradientInput
                                    value={transportation}
                                    onChangeText={setTransportation}
                                    placeholder="e.g. Walking, Bus, Bike..."
                                />

                                <Text className="text-gray-400 ml-1">Languages (comma separated)</Text>
                                <GradientInput
                                    value={languagesInput}
                                    onChangeText={setLanguagesInput}
                                    placeholder="Polski, English, Deutsch..."
                                />

                                <Text className="text-gray-400 ml-1">Available Dates (comma separated)</Text>
                                <GradientInput
                                    value={datesInput}
                                    onChangeText={setDatesInput}
                                    placeholder="Every Monday, 2024-05-20, etc."
                                />

                                <Text className="text-gray-400 ml-1">Highlights (comma separated)</Text>
                                <GradientInput
                                    value={highlightsInput}
                                    onChangeText={setHighlightsInput}
                                    placeholder="Old Town, Castle, River Cruise..."
                                />

                                <Text className="text-gray-400 ml-1">What's Included (comma separated)</Text>
                                <GradientInput
                                    value={whatsIncludedInput}
                                    onChangeText={setWhatsIncludedInput}
                                    placeholder="Transport, Lunch, Guide..."
                                />

                                <Text className="text-gray-400 ml-1">What to Bring (comma separated)</Text>
                                <GradientInput
                                    value={whatToBringInput}
                                    onChangeText={setWhatToBringInput}
                                    placeholder="Comfortable shoes, Water, Camera..."
                                />
                            </View>
                        )}


                        {/* Location */}
                        <View className="gap-4">
                            <Text className="text-neon-secondary font-bold text-lg">Location</Text>
                            <Text className="text-gray-400 text-sm">Drag or click to set exact location.</Text>

                            <View className="h-64 rounded-xl overflow-hidden border border-slate-700">
                                <MapView
                                    provider={PROVIDER_GOOGLE}
                                    style={{ flex: 1 }}
                                    region={region}
                                    onRegionChangeComplete={setRegion}
                                    onPress={handleMapPress}
                                >
                                    <Marker
                                        coordinate={markerCoords}
                                        draggable
                                        onDragEnd={handleDragEnd}
                                    />
                                </MapView>
                            </View>

                            <GradientInput value={address} onChangeText={setAddress} placeholder="Address" />
                            <View className="flex-row gap-2">
                                <View className="flex-1"><GradientInput value={city} onChangeText={setCity} placeholder="City" /></View>
                                {/* Zip Code Removed */}
                            </View>
                            <GradientInput value={country} onChangeText={setCountry} placeholder="Country" />
                        </View>

                        {/* Submit */}
                        {loading || uploading ? (
                            <View className="items-center">
                                <ActivityIndicator size="large" color="#00D4FF" />
                                {uploading && <Text className="text-text-muted mt-2">Uploading images...</Text>}
                            </View>
                        ) : (
                            <GradientButton onPress={handleSubmit} title={`Create ${offerType === 'ACCOMMODATION' ? 'Property' : 'Tour'}`} />
                        )}
                    </View>
                </ScrollView>
            </View>
        </GradientBackground>
    );
}
