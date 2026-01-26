import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
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

export default function EditOfferScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    // --- STATE DEFINITIONS ---
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [offerType, setOfferType] = useState<"ACCOMMODATION" | "TOURS">("ACCOMMODATION");

    // Accommodation Specific
    const [amenitiesInput, setAmenitiesInput] = useState("");
    const [checkInTime, setCheckInTime] = useState("");
    const [checkOutTime, setCheckOutTime] = useState("");
    const [propertyType, setPropertyType] = useState("HOTEL");

    // Tour Specific
    const [duration, setDuration] = useState("");
    const [maxParticipants, setMaxParticipants] = useState("");
    const [meetingPoint, setMeetingPoint] = useState("");
    const [languagesInput, setLanguagesInput] = useState("");
    const [whatsIncludedInput, setWhatsIncludedInput] = useState("");
    const [difficulty, setDifficulty] = useState("EASY");
    const [pickupIncluded, setPickupIncluded] = useState(false);
    const [minimumAge, setMinimumAge] = useState("");
    const [highlightsInput, setHighlightsInput] = useState("");
    const [datesInput, setDatesInput] = useState("");
    const [whatToBringInput, setWhatToBringInput] = useState("");
    const [transportation, setTransportation] = useState("");

    // Location
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [region, setRegion] = useState<Region>({
        latitude: 52.2297,
        longitude: 21.0122,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
    });
    const [markerCoords, setMarkerCoords] = useState({ latitude: 52.2297, longitude: 21.0122 });

    // Images
    const [images, setImages] = useState<string[]>([]);

    // Helper to request location permissions
    const requestLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            // console.log('Permission to access location was denied');
        }
    };

    // --- EFFECT: Fetch Offer Data ---
    useEffect(() => {
        if (!id) return;
        requestLocationPermission();

        const fetchOffer = async () => {
            try {
                const doc = await firestore().collection('offers').doc(id as string).get();
                if (doc.exists) {
                    const data = doc.data() as any;

                    setTitle(data.title || "");
                    setDescription(data.description || "");
                    setPrice(data.price?.toString() || "");
                    setOfferType(data.type || "ACCOMMODATION");

                    if (data.location) {
                        setAddress(data.location.address || "");
                        setCity(data.location.city || "");
                        setCountry(data.location.country || "");
                        setMarkerCoords({
                            latitude: data.location.latitude || 52.2297,
                            longitude: data.location.longitude || 21.0122
                        });
                        setRegion({
                            latitude: data.location.latitude || 52.2297,
                            longitude: data.location.longitude || 21.0122,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05
                        });
                    }

                    setImages(data.images || []);

                    const details = data.details || {};
                    if (data.type === 'ACCOMMODATION') {
                        setAmenitiesInput(details.generalAmenities?.join(', ') || "");
                        setCheckInTime(details.checkInTime || "");
                        setCheckOutTime(details.checkOutTime || "");
                        setPropertyType(details.propertyType || "HOTEL");
                    } else {
                        // TOURS
                        setDuration(details.duration?.toString() || "");
                        setMaxParticipants(details.maxParticipants?.toString() || "");
                        setMeetingPoint(details.meetingPoint || "");
                        setLanguagesInput(details.languages?.join(', ') || "");
                        setWhatsIncludedInput(details.whatsIncluded?.join(', ') || "");
                        setHighlightsInput(details.highlights?.join(', ') || "");
                        setDatesInput(details.startDates?.join(', ') || "");
                        setWhatToBringInput(details.whatToBring?.join(', ') || "");
                        setTransportation(details.transportation || "");
                        setPickupIncluded(details.pickupIncluded || false);
                        setDifficulty(details.difficulty || "EASY");
                        setMinimumAge(details.minimumAge?.toString() || "");
                    }

                } else {
                    Alert.alert("Error", "Offer not found");
                    router.back();
                }
            } catch (error) {
                console.error("Error fetching offer:", error);
                Alert.alert("Error", "Failed to load offer details");
            } finally {
                setLoading(false);
            }
        };
        fetchOffer();
    }, [id]);

    // --- HANDLERS ---
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
            setUploading(true);
            const newImages = [...images];
            // In a real app we might upload here or on save. 
            // For now, let's assume we upload immediately to get a URL, 
            // OR we just store local URI and upload on save. 
            // Based on create-property, existing flow uploads immediately? 
            // create-property uploads on submit. edit.tsx logic usually varies.
            // Let's stick to simple: add to list, upload on submit. 
            // BUT wait, existing images are URLs. Mixed array?
            // Let's upload immediately to keep array consistent as URLs.

            for (const asset of result.assets) {
                try {
                    const downloadUrl = await uploadImage(`offers/${id}/update_${Date.now()}`, asset.uri);
                    newImages.push(downloadUrl);
                } catch (e) {
                    Alert.alert("Upload Failed", "Could not upload image.");
                }
            }
            setImages(newImages);
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
    };

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

    const handleUpdate = async () => {
        if (!title || !description || !price || !city) {
            Alert.alert("Missing Fields", "Please fill in basic fields (Title, Description, Price, City).");
            return;
        }

        setUpdating(true);
        try {
            const geohash = geofire.geohashForLocation([markerCoords.latitude, markerCoords.longitude]);

            const baseData = {
                title,
                description,
                price: parseFloat(price) || 0,
                location: {
                    latitude: markerCoords.latitude,
                    longitude: markerCoords.longitude,
                    address,
                    city,
                    country,
                    geohash
                },
                images,
                updatedAt: Date.now(),
            };

            let typeData = {};
            if (offerType === 'ACCOMMODATION') {
                typeData = {
                    details: {
                        propertyType, // preserve if not edited
                        generalAmenities: amenitiesInput.split(',').map(s => s.trim()).filter(Boolean),
                        checkInTime,
                        checkOutTime
                    }
                };
            } else {
                typeData = {
                    details: {
                        duration: parseFloat(duration) || 0,
                        maxParticipants: parseInt(maxParticipants) || 0,
                        meetingPoint,
                        languages: languagesInput.split(',').map(s => s.trim()).filter(Boolean),
                        whatsIncluded: whatsIncludedInput.split(',').map(s => s.trim()).filter(Boolean),
                        highlights: highlightsInput.split(',').map(s => s.trim()).filter(Boolean),
                        startDates: datesInput.split(',').map(s => s.trim()).filter(Boolean),
                        whatToBring: whatToBringInput.split(',').map(s => s.trim()).filter(Boolean),
                        transportation,
                        pickupIncluded,
                        difficulty,
                        minimumAge: parseInt(minimumAge) || 0,
                    }
                };
            }

            // We use set with merge true or update. Update is safer if doc exists.
            await firestore().collection('offers').doc(id as string).update({
                ...baseData,
                ...typeData
            });

            Alert.alert("Success", "Offer updated successfully!");
            router.back();

        } catch (error) {
            console.error("Update Error:", error);
            Alert.alert("Error", "Failed to update offer.");
        } finally {
            setUpdating(false);
        }
    };

    const handleGenerateDescription = async () => {
        if (!title || !city) {
            Alert.alert("Missing Info", "Please ensure Title and City are filled to generate a description.");
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

    // --- RENDER ---
    if (loading) {
        return (
            <GradientBackground variant="full">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#00D4FF" />
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground variant="full">
            <View className="flex-1 pt-12 px-4">
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 w-10 h-10 bg-slate-800 rounded-full items-center justify-center">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-white">Edit Offer</Text>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                    <View className="mb-4">
                        <Text className="text-slate-400 mb-2">Title</Text>
                        <GradientInput value={title} onChangeText={setTitle} placeholder="Title" />
                    </View>

                    <View className="mb-4">
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
                            placeholder="Describe your property..."
                            multiline
                            numberOfLines={4}
                            style={{ height: 100, textAlignVertical: 'top' }}
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-slate-400 mb-2">Price ({offerType === 'TOURS' ? 'per person' : 'per night'})</Text>
                        <GradientInput
                            value={price}
                            onChangeText={setPrice}
                            placeholder="0.00"
                            keyboardType="numeric"
                            icon={<Text className="text-slate-400 pl-2">$</Text>}
                        />
                    </View>

                    {/* Type Specific Fields */}
                    {
                        offerType === 'ACCOMMODATION' && (
                            <>
                                <Text className="text-white font-bold text-lg mb-4 mt-2">Accommodation Details</Text>

                                <View className="mb-4">
                                    <Text className="text-slate-400 mb-2">Amenities (comma separated)</Text>
                                    <GradientInput value={amenitiesInput} onChangeText={setAmenitiesInput} placeholder="Wifi, Pool, Gym..." />
                                </View>

                                <View className="flex-row gap-4 mb-4">
                                    <View className="flex-1">
                                        <Text className="text-slate-400 mb-2">Check-in</Text>
                                        <GradientInput value={checkInTime} onChangeText={setCheckInTime} placeholder="14:00" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-400 mb-2">Check-out</Text>
                                        <GradientInput value={checkOutTime} onChangeText={setCheckOutTime} placeholder="11:00" />
                                    </View>
                                </View>
                            </>
                        )
                    }

                    {
                        offerType === 'TOURS' && (
                            <>
                                <Text className="text-white font-bold text-lg mb-4 mt-2">Tour Details</Text>

                                <View className="flex-row gap-4 mb-4">
                                    <View className="flex-1">
                                        <Text className="text-slate-400 mb-2">Duration</Text>
                                        <GradientInput value={duration} onChangeText={setDuration} placeholder="e.g. 5 hours" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-400 mb-2">Max Participants</Text>
                                        <GradientInput value={maxParticipants} onChangeText={setMaxParticipants} keyboardType="numeric" placeholder="e.g. 10" />
                                    </View>
                                </View>

                                <View className="mb-4">
                                    <Text className="text-slate-400 mb-2">Meeting Point</Text>
                                    <GradientInput value={meetingPoint} onChangeText={setMeetingPoint} placeholder="Enter address or landmark" />
                                </View>

                                <View className="mb-4">
                                    <Text className="text-slate-400 mb-2">Languages (comma separated)</Text>
                                    <GradientInput value={languagesInput} onChangeText={setLanguagesInput} placeholder="English, Polish, Spanish..." />
                                </View>

                                <View className="mb-4">
                                    <Text className="text-slate-400 mb-2">What's Included (comma separated)</Text>
                                    <GradientInput value={whatsIncludedInput} onChangeText={setWhatsIncludedInput} placeholder="Transport, Lunch, Guide..." />
                                </View>
                            </>
                        )
                    }

                    {/* Location */}
                    <Text className="text-white font-bold text-lg mb-4 mt-4">Location</Text>

                    <View className="h-48 rounded-xl overflow-hidden mb-4 border border-slate-700">
                        <MapView
                            style={{ flex: 1 }}
                            region={region}
                            onRegionChangeComplete={(reg) => {
                                setRegion(reg);
                                setMarkerCoords({ latitude: reg.latitude, longitude: reg.longitude });
                            }}
                            onPress={(e) => {
                                setMarkerCoords(e.nativeEvent.coordinate);
                                reverseGeocode(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude);
                            }}
                            provider={PROVIDER_GOOGLE}
                        >
                            <Marker coordinate={markerCoords} />
                        </MapView>
                    </View>

                    <View className="mb-4">
                        <Text className="text-slate-400 mb-2">Address</Text>
                        <GradientInput value={address} onChangeText={setAddress} placeholder="Street Address" />
                    </View>

                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-slate-400 mb-2">City</Text>
                            <GradientInput value={city} onChangeText={setCity} placeholder="City" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 mb-2">Country</Text>
                            <GradientInput value={country} onChangeText={setCountry} placeholder="Country" />
                        </View>
                    </View>

                    {/* Images */}
                    <Text className="text-white font-bold text-lg mb-4 mt-2">Images</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        <TouchableOpacity
                            onPress={pickImage}
                            className="w-24 h-24 bg-slate-800 rounded-xl items-center justify-center border border-slate-700 mr-3"
                        >
                            {uploading ? (
                                <ActivityIndicator color="#00D4FF" />
                            ) : (
                                <Ionicons name="add" size={32} color="#00D4FF" />
                            )}
                        </TouchableOpacity>

                        {images.map((img, index) => (
                            <View key={index} className="relative mr-3">
                                <Image source={{ uri: img }} style={{ width: 96, height: 96, borderRadius: 12 }} />
                                <TouchableOpacity
                                    onPress={() => removeImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                                >
                                    <Ionicons name="close" size={12} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>

                    <GradientButton
                        onPress={handleUpdate}
                        title={updating ? "Updating..." : "Update Offer"}
                        disabled={updating || uploading}
                    />

                    <View className="h-20" />
                </ScrollView>
            </View>
        </GradientBackground>
    );
}