import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useState, useCallback, useEffect } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { GradientBackground } from "../../components/GradientBackground";
import { Ionicons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Image } from "expo-image";
import { Reservation, ReservationStatus } from "../../types/reservation";
import { ReviewModal } from "../../components/ReviewModal";
import { Review } from "../../types/review";

type FilterTab = 'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

export default function TouristBookingsScreen() {
    const router = useRouter();
    const currentUser = auth().currentUser;

    const [bookings, setBookings] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState<FilterTab>('ALL');

    // Review State
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState<Reservation | null>(null);

    const fetchBookings = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const snapshot = await firestore()
                .collection('bookings')
                .where('clientId', '==', currentUser.uid)
                .get();

            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
            // Sort by createdAt desc
            data.sort((a, b) => b.createdAt - a.createdAt);
            setBookings(data);
        } catch (error) {
            console.error("Error loading bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-update ACCEPTED bookings to COMPLETED when end date passes
    useEffect(() => {
        const updateCompletedBookings = async () => {
            const now = Date.now();
            const toUpdate = bookings.filter(b =>
                b.status === 'ACCEPTED' && b.endDate < now
            );

            if (toUpdate.length > 0) {
                try {
                    const batch = firestore().batch();
                    toUpdate.forEach(booking => {
                        const ref = firestore().collection('bookings').doc(booking.id);
                        batch.update(ref, { status: 'COMPLETED', updatedAt: Date.now() });
                    });
                    await batch.commit();
                    fetchBookings(); // Refresh to show updated statuses
                } catch (error) {
                    console.error("Error updating completed bookings:", error);
                }
            }
        };

        if (bookings.length > 0) {
            updateCompletedBookings();
        }
    }, [bookings]);

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [])
    );

    const handleCancel = async (bookingId: string) => {
        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await firestore().collection('bookings').doc(bookingId).update({
                                status: 'CANCELLED',
                                updatedAt: Date.now()
                            });
                            fetchBookings(); // Refresh
                        } catch (error) {
                            Alert.alert("Error", "Failed to cancel booking.");
                        }
                    }
                }
            ]
        );
    };

    const handleRatePress = (booking: Reservation) => {
        setSelectedBookingForReview(booking);
        setReviewModalVisible(true);
    };

    const handleReviewSuccess = () => {
        Alert.alert("Success", "Thank you for your review!");
        fetchBookings();
    };

    const filteredBookings = bookings.filter(b => {
        if (selectedTab === 'ALL') return true;
        if (selectedTab === 'CANCELLED') return b.status === 'CANCELLED' || b.status === 'REJECTED';
        if (selectedTab === 'COMPLETED') return b.status === 'COMPLETED';
        return b.status === selectedTab;
    });

    const getStatusColor = (status: ReservationStatus) => {
        switch (status) {
            case 'ACCEPTED': return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'PENDING': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'CANCELLED': return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
            default: return 'bg-slate-500/20 text-white';
        }
    };

    const renderItem = ({ item }: { item: Reservation }) => {
        const canCancel = item.status === 'PENDING' || item.status === 'ACCEPTED';

        // Only allow review for COMPLETED bookings
        const canReview = item.status === 'COMPLETED' && !item.hasReviewed;
        const dateRange = `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}`;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                className="bg-slate-800/90 border border-slate-700 rounded-xl mb-4 overflow-hidden"
            >
                <View className="flex-row">
                    <Image
                        source={{ uri: item.offerImage }}
                        style={{ width: 100, height: 100 }}
                        contentFit="cover"
                    />
                    <View className="flex-1 p-3 justify-between">
                        <View>
                            <Text className="text-white font-bold text-lg" numberOfLines={1}>{item.offerTitle}</Text>
                            <Text className="text-slate-400 text-xs mt-1">{dateRange}</Text>
                        </View>
                        <View className="flex-row justify-between items-end">
                            <View className={`px-2 py-1 rounded border self-start ${getStatusColor(item.status)}`}>
                                <Text className={`text-xs font-bold capitalize ${getStatusColor(item.status).split(' ')[1]}`}>
                                    {item.status}
                                </Text>
                            </View>
                            <Text className="text-slate-500 text-xs text-right">
                                {item.unitName}
                                {'\n'}
                                {item.guestCount} guest(s)
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Actions */}
                <View className="flex-row justify-end bg-slate-800 border-t border-slate-700">
                    {canCancel && item.status !== 'COMPLETED' && (
                        <TouchableOpacity
                            onPress={() => handleCancel(item.id)}
                            className="p-3 mr-auto"
                        >
                            <Text className="text-red-400 font-bold text-xs">Cancel</Text>
                        </TouchableOpacity>
                    )}

                    {canReview && (
                        <TouchableOpacity
                            onPress={() => handleRatePress(item)}
                            className="bg-neon-primary px-6 py-3 flex-row items-center"
                        >
                            <Ionicons name="star" size={16} color="white" />
                            <Text className="text-white font-bold text-xs ml-2">Rate Stay</Text>
                        </TouchableOpacity>
                    )}

                    {item.hasReviewed && (
                        <View className="p-3 flex-row items-center">
                            <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                            <Text className="text-green-400 font-bold text-xs ml-2">Reviewed</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <GradientBackground variant="full">
            <View className="flex-1 pt-12 pb-4 px-4">
                <Text className="text-2xl font-bold text-white mb-4">My Bookings</Text>

                {/* Filters */}
                <View className="flex-row mb-6 bg-slate-900/50 p-1 rounded-lg">
                    {(['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED', 'CANCELLED'] as FilterTab[]).map(tab => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setSelectedTab(tab)}
                            className={`flex-1 py-2 items-center rounded-md ${selectedTab === tab ? 'bg-slate-700' : ''}`}
                        >
                            <Text className={`text-xs font-bold ${selectedTab === tab ? 'text-white' : 'text-slate-400'}`}>
                                {tab === 'CANCELLED' ? 'ARCHIVE' : tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator size="large" color="#00D4FF" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredBookings}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View className="items-center justify-center mt-20">
                                <Ionicons name="calendar-outline" size={64} color="#475569" />
                                <Text className="text-slate-500 mt-4 text-center text-lg">No bookings found</Text>
                            </View>
                        }
                    />
                )}

                {selectedBookingForReview && (
                    <ReviewModal
                        visible={reviewModalVisible}
                        onClose={() => setReviewModalVisible(false)}
                        offerId={selectedBookingForReview.offerId}
                        reservationId={selectedBookingForReview.id}
                        onSuccess={handleReviewSuccess}
                    />
                )}
            </View>
        </GradientBackground>
    );
}
