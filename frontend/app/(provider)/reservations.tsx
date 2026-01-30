import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { GradientBackground } from "../../components/GradientBackground";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Reservation, ReservationStatus } from "../../types/reservation";

export default function ProviderReservationsScreen() {
    const currentUser = auth().currentUser;
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReservations = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const snapshot = await firestore()
                .collection('bookings')
                .where('providerId', '==', currentUser.uid)
                .get();

            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
            
            data.sort((a, b) => b.createdAt - a.createdAt);
            setReservations(data);
        } catch (error) {
            console.error("Error loading reservations:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchReservations();
        }, [])
    );

    const handleStatusUpdate = async (reservationId: string, newStatus: 'ACCEPTED' | 'REJECTED') => {
        try {
            await firestore().collection('bookings').doc(reservationId).update({
                status: newStatus,
                updatedAt: Date.now()
            });
            
            setReservations(prev => prev.map(r =>
                r.id === reservationId ? { ...r, status: newStatus } : r
            ));
            Alert.alert("Success", `Reservation ${newStatus.toLowerCase()}.`);
        } catch (error) {
            console.error("Error updating status:", error);
            Alert.alert("Error", "Failed to update reservation status.");
        }
    };

    const getStatusColor = (status: ReservationStatus) => {
        switch (status) {
            case 'ACCEPTED': return 'text-green-400 border-green-500/50 bg-green-500/10';
            case 'PENDING': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
            case 'REJECTED': return 'text-red-400 border-red-500/50 bg-red-500/10';
            case 'CANCELLED': return 'text-slate-400 border-slate-500/50 bg-slate-500/10';
            default: return 'text-white border-white/50';
        }
    };

    const renderItem = ({ item }: { item: Reservation }) => {
        const dateRange = `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}`;
        const isPending = item.status === 'PENDING';

        return (
            <View className="bg-slate-800/90 border border-slate-700 rounded-xl mb-4 p-4">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                        <Text className="text-white font-bold text-lg mb-1">{item.offerTitle}</Text>
                        <View className="flex-row items-center mb-1">
                            <Ionicons name="person" size={14} color="#94A3B8" />
                            <Text className="text-slate-300 ml-1 font-medium">{item.contactDetails.fullName}</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Ionicons name="calendar-outline" size={14} color="#94A3B8" />
                            <Text className="text-slate-400 ml-1 text-xs">{dateRange}</Text>
                        </View>
                    </View>
                    <View className={`px-2 py-1 rounded border ${getStatusColor(item.status)}`}>
                        <Text className={`text-xs font-bold capitalize ${getStatusColor(item.status).split(' ')[0]}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                {}
                <View className="flex-row gap-4 mt-2 border-t border-slate-700/50 pt-2 mb-3">
                    <View className="flex-1">
                        <Text className="text-slate-500 text-xs">Unit</Text>
                        <Text className="text-slate-300 font-medium">{item.unitName}</Text>
                    </View>
                    <View>
                        <Text className="text-slate-500 text-xs">Guests</Text>
                        <Text className="text-slate-300 font-medium">{item.guestCount}</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-slate-500 text-xs">Contact</Text>
                        <Text className="text-slate-300 font-medium" numberOfLines={1}>{item.contactDetails.phone}</Text>
                    </View>
                </View>

                {}
                {isPending && (
                    <View className="flex-row gap-3 pt-2 border-t border-slate-700">
                        <TouchableOpacity
                            onPress={() => handleStatusUpdate(item.id, 'REJECTED')}
                            className="flex-1 bg-red-500/10 py-2 rounded-lg items-center border border-red-500/30"
                        >
                            <Text className="text-red-400 font-bold">Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleStatusUpdate(item.id, 'ACCEPTED')}
                            className="flex-1 bg-green-500/10 py-2 rounded-lg items-center border border-green-500/30"
                        >
                            <Text className="text-green-400 font-bold">Accept</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <GradientBackground variant="full">
            <View className="flex-1 pt-12 pb-4 px-4">
                <Text className="text-2xl font-bold text-white mb-6">Reservations</Text>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#00D4FF" />
                    </View>
                ) : (
                    <FlatList
                        data={reservations}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center mt-20">
                                <Ionicons name="calendar-number-outline" size={64} color="#475569" />
                                <Text className="text-slate-500 mt-4 text-center text-lg">No reservations yet</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </GradientBackground>
    );
}
