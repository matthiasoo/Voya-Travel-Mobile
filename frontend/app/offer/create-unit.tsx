import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { Image } from "expo-image";

import { GradientBackground } from "../../components/GradientBackground";
import { GradientInput } from "../../components/GradientInput";
import { GradientButton } from "../../components/GradientButton";
import { uploadImage } from "../../utils/storage";
import { AccommodationOffer, AccommodationUnit } from "../../types/offer";
import { AIService } from "../../services/ai";

export default function CreateUnitScreen() {
    const { offerId } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<'ROOM' | 'ENTIRE_APARTMENT' | 'BED_IN_DORM'>('ROOM');
    const [price, setPrice] = useState("");
    const [adults, setAdults] = useState("2");
    const [children, setChildren] = useState("0");
    const [bedConfig, setBedConfig] = useState("");
    const [size, setSize] = useState("");
    const [amenitiesInput, setAmenitiesInput] = useState("");
    const [quantity, setQuantity] = useState("1");

    
    const [images, setImages] = useState<string[]>([]); 

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
        if (!name || !price || !adults) {
            Alert.alert("Error", "Please fill in Name, Price and Capacity.");
            return;
        }

        setLoading(true);

        try {
            const safetyCheck = await AIService.checkContentSafety(`${name}\n${description}`);
            if (!safetyCheck.safe) {
                Alert.alert("Content Unsafe", `Your unit content was flagged: ${safetyCheck.reason}. Please revise.`);
                setLoading(false);
                return;
            }
        } catch (err) {
            console.error("Safety check failed:", err);
        }

        try {
            const currentUser = auth().currentUser;
            if (!currentUser) throw new Error("User not logged in");

            const unitId = Date.now().toString(); 
            const priceNum = parseFloat(price);
            const quantityNum = parseInt(quantity) || 1;

            
            const imageUrls: string[] = [];
            if (images.length > 0) {
                setUploading(true);
                for (const uri of images) {
                    
                    const filename = uri.substring(uri.lastIndexOf('/') + 1);
                    const path = `offers/${offerId}/units/${unitId}`;
                    const url = await uploadImage(path, uri);
                    imageUrls.push(url);
                }
                setUploading(false);
            }

            const amenities = amenitiesInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

            const newUnit: AccommodationUnit = {
                id: unitId,
                name,
                unitDescription: description,
                type,
                pricePerNight: priceNum,
                capacity: {
                    adults: parseInt(adults) || 2,
                    children: parseInt(children) || 0
                },
                bedConfiguration: bedConfig,
                size: parseFloat(size) || 0,
                amenities,
                images: imageUrls,
                quantity: quantityNum
            };

            const offerRef = firestore().collection('offers').doc(offerId as string);

            await firestore().runTransaction(async (transaction) => {
                const offerDoc = await transaction.get(offerRef);
                const exists = typeof offerDoc.exists === 'function' ? offerDoc.exists() : offerDoc.exists;
                if (!exists) {
                    throw "Offer does not exist!";
                }

                const offerData = offerDoc.data() as AccommodationOffer;
                const currentUnits = offerData.details.units || [];

                
                const updatedUnits = [...currentUnits, newUnit];

                
                let minPrice = priceNum;
                if (currentUnits.length > 0) {
                    
                    const existingMin = Math.min(...currentUnits.map(u => u.pricePerNight));
                    minPrice = Math.min(minPrice, existingMin);
                }

                
                transaction.update(offerRef, {
                    'details.units': updatedUnits,
                    price: minPrice
                });
            });

            Alert.alert("Success", "Unit added successfully!", [
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
                {}
                <View className="flex-row items-center p-4 pt-12 border-b border-slate-800 bg-slate-900/50">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-white">Add Unit</Text>
                </View>

                <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                    <View className="gap-6 pb-10">
                        {}
                        <View className="gap-4">
                            <Text className="text-neon-secondary font-bold text-lg">Unit Information</Text>
                            <GradientInput value={name} onChangeText={setName} placeholder="Unit Name (e.g. Deluxe Room)" />
                            <GradientInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Description"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View className="gap-2">
                            <Text className="text-gray-400 ml-1">Type</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {(['ROOM', 'ENTIRE_APARTMENT', 'BED_IN_DORM'] as const).map(t => (
                                    <TouchableOpacity
                                        key={t}
                                        onPress={() => setType(t)}
                                        className={`px-4 py-2 rounded-lg border ${type === t ? 'bg-neon-primary border-neon-primary' : 'bg-slate-800 border-slate-600'}`}
                                    >
                                        <Text className={`font-bold ${type === t ? 'text-black' : 'text-gray-300'}`}>{t.replace(/_/g, ' ')}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {}
                        <View className="gap-4">
                            <Text className="text-neon-secondary font-bold text-lg">Pricing & Capacity</Text>
                            <GradientInput value={price} onChangeText={setPrice} placeholder="Price per Night (USD)" keyboardType="numeric" />

                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <Text className="text-gray-400 ml-1 mb-1">Adults</Text>
                                    <GradientInput value={adults} onChangeText={setAdults} placeholder="2" keyboardType="numeric" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-400 ml-1 mb-1">Children</Text>
                                    <GradientInput value={children} onChangeText={setChildren} placeholder="0" keyboardType="numeric" />
                                </View>
                            </View>

                            <GradientInput value={quantity} onChangeText={setQuantity} placeholder="Quantity (Inventory)" keyboardType="numeric" />
                        </View>

                        {}
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

                        {}
                        <View className="gap-4">
                            <Text className="text-neon-secondary font-bold text-lg">Details</Text>
                            <GradientInput value={bedConfig} onChangeText={setBedConfig} placeholder="Bed Configuration (e.g. 1 King)" />
                            <GradientInput value={size} onChangeText={setSize} placeholder="Size (m²)" keyboardType="numeric" />
                            <GradientInput value={amenitiesInput} onChangeText={setAmenitiesInput} placeholder="Amenities (comma separated)" />
                        </View>


                        {}
                        {loading || uploading ? (
                            <View className="items-center">
                                <ActivityIndicator size="large" color="#00D4FF" />
                                {uploading && <Text className="text-text-muted mt-2">Uploading images...</Text>}
                            </View>
                        ) : (
                            <GradientButton onPress={handleSubmit} title="Add Unit" />
                        )}
                    </View>
                </ScrollView>
            </View>
        </GradientBackground>
    );
}
