import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { UserAddress } from "../types/reservation";

interface BookingModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (contactDetails: UserAddress, saveAddress: boolean) => Promise<void>;
    unitName: string;
    totalPrice: number;
    currency: string;
    dates: string; 
}

export function BookingModal({ visible, onClose, onSubmit, unitName, totalPrice, currency, dates }: BookingModalProps) {
    const currentUser = auth().currentUser;
    const [submitting, setSubmitting] = useState(false);

    
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [country, setCountry] = useState("");
    const [saveAddress, setSaveAddress] = useState(false);

    useEffect(() => {
        if (!visible || !currentUser) return;

        const fetchUserAddress = async () => {
            try {
                const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
                
                const exists = typeof userDoc.exists === 'function' ? userDoc.exists() : userDoc.exists;
                if (exists) {
                    const userData = userDoc.data();
                    if (userData?.savedAddress) {
                        const addr = userData.savedAddress;
                        setFullName(addr.fullName || userData.fullName || "");
                        setPhone(addr.phone || "");
                        setStreet(addr.street || "");
                        setCity(addr.city || "");
                        setZipCode(addr.zipCode || "");
                        setCountry(addr.country || "");
                    } else {
                        setFullName(userData?.fullName || "");
                    }
                }
            } catch (err) {
                console.log("Error pre-filling address", err);
            }
        };
        fetchUserAddress();
    }, [visible, currentUser]);

    const handleSubmit = async () => {
        if (!fullName || !phone || !street || !city || !zipCode || !country) {
            Alert.alert("Missing Fields", "Please fill in all address fields.");
            return;
        }

        setSubmitting(true);
        try {
            const contact: UserAddress = { fullName, phone, street, city, zipCode, country };
            await onSubmit(contact, saveAddress);
            onClose(); 
        } catch (error) {
            Alert.alert("Error", "Booking failed. Please try again.");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View className="bg-slate-900 rounded-t-3xl border-t border-slate-700 h-[85%]">
                        {}
                        <View className="flex-row items-center justify-between p-4 border-b border-slate-700">
                            <Text className="text-xl font-bold text-white">Confirm Booking</Text>
                            <TouchableOpacity onPress={onClose} className="p-2 bg-slate-800 rounded-full">
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 40 }}>
                            {}
                            <View className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
                                <Text className="text-slate-400 text-xs uppercase mb-1">Booking Summary</Text>
                                <Text className="text-white font-bold text-lg mb-1">{unitName}</Text>
                                <Text className="text-slate-300 text-sm mb-3">{dates}</Text>
                                <View className="border-t border-slate-700 pt-2 flex-row justify-between items-center">
                                    <Text className="text-slate-400">Total Price</Text>
                                    <Text className="text-neon-primary font-bold text-xl">{currency} {totalPrice}</Text>
                                </View>
                            </View>

                            {}
                            <Text className="text-white font-bold mb-4 text-lg">Contact Information</Text>
                            <View className="gap-3 mb-4">
                                <View>
                                    <Text className="text-slate-400 text-xs mb-1">Full Name</Text>
                                    <TextInput value={fullName} onChangeText={setFullName} className="bg-slate-800 text-white p-3 rounded-lg border border-slate-700" />
                                </View>
                                <View>
                                    <Text className="text-slate-400 text-xs mb-1">Phone</Text>
                                    <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" className="bg-slate-800 text-white p-3 rounded-lg border border-slate-700" />
                                </View>
                                <View>
                                    <Text className="text-slate-400 text-xs mb-1">Street Address</Text>
                                    <TextInput value={street} onChangeText={setStreet} className="bg-slate-800 text-white p-3 rounded-lg border border-slate-700" />
                                </View>
                                <View className="flex-row gap-3">
                                    <View className="flex-1">
                                        <Text className="text-slate-400 text-xs mb-1">City</Text>
                                        <TextInput value={city} onChangeText={setCity} className="bg-slate-800 text-white p-3 rounded-lg border border-slate-700" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-slate-400 text-xs mb-1">Zip Code</Text>
                                        <TextInput value={zipCode} onChangeText={setZipCode} className="bg-slate-800 text-white p-3 rounded-lg border border-slate-700" />
                                    </View>
                                </View>
                                <View>
                                    <Text className="text-slate-400 text-xs mb-1">Country</Text>
                                    <TextInput value={country} onChangeText={setCountry} className="bg-slate-800 text-white p-3 rounded-lg border border-slate-700" />
                                </View>
                            </View>

                            <View className="flex-row items-center mb-6">
                                <Switch
                                    value={saveAddress}
                                    onValueChange={setSaveAddress}
                                    trackColor={{ false: "#767577", true: "#00D4FF" }}
                                    thumbColor={saveAddress ? "#ffffff" : "#f4f3f4"}
                                />
                                <Text className="text-white ml-3 text-sm">Save this address for future bookings</Text>
                            </View>

                            {}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={submitting}
                                className={`p-4 rounded-xl items-center justify-center ${submitting ? 'bg-slate-600' : 'bg-neon-primary'}`}
                            >
                                {submitting ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Confirm & Pay</Text>}
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
