import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { Calendar } from "react-native-calendars";
import { format, eachDayOfInterval, startOfDay, isSameDay } from "date-fns";
import { Image } from "expo-image";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Offer, AccommodationUnit } from "../types/offer";
import { Reservation, UserAddress } from "../types/reservation";
import { BookingModal } from "./BookingModal";
import { Ionicons } from "@expo/vector-icons";

interface BookingSectionProps {
    offer: Offer;
}

export function BookingSection({ offer }: BookingSectionProps) {
    const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
    const [bookings, setBookings] = useState<Reservation[]>([]);
    const [calculating, setCalculating] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<AccommodationUnit | null>(null);

    const currentUser = auth().currentUser;
    const [userRole, setUserRole] = useState<string | null>(null);

    useState(() => {
        if (currentUser) {
            firestore().collection('users').doc(currentUser.uid).get()
                .then(doc => {
                    const exists = typeof doc.exists === 'function' ? doc.exists() : doc.exists;
                    if (exists) {
                        setUserRole(doc.data()?.role);
                    }
                })
                .catch(err => console.error("Error fetching user role:", err));
        }
    });

    // Fetch Bookings when component mounts or offer changes
    const fetchBookings = useCallback(async () => {
        setCalculating(true);
        try {
            const snapshot = await firestore()
                .collection('bookings')
                .where('offerId', '==', offer.id)
                .get();

            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation))
                .filter(res => res.status !== 'CANCELLED' && res.status !== 'REJECTED'); // Exclude cancelled
            setBookings(fetched);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setCalculating(false);
        }
    }, [offer.id]);

    // Initial fetch
    // UseEffect or just call it? Let's use a trigger logic.
    // Actually, good to fetch once.
    useState(() => {
        fetchBookings();
    });

    const onDayPress = (day: any) => {
        const dateString = day.dateString;
        if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
            // New selection
            setSelectedStartDate(dateString);
            setSelectedEndDate(null);
        } else if (selectedStartDate && !selectedEndDate) {
            // End selection
            // Simple check: is end before start?
            if (new Date(dateString) < new Date(selectedStartDate)) {
                setSelectedStartDate(dateString);
                setSelectedEndDate(null);
            } else {
                setSelectedEndDate(dateString);
            }
        }
    };

    const markedDates = useMemo(() => {
        const marks: any = {};
        if (selectedStartDate) {
            marks[selectedStartDate] = { startingDay: true, color: '#00D4FF', textColor: 'white' };
            if (selectedEndDate) {
                const start = new Date(selectedStartDate);
                const end = new Date(selectedEndDate);
                const days = eachDayOfInterval({ start, end });
                days.forEach(d => {
                    const ds = format(d, 'yyyy-MM-dd');
                    if (ds === selectedStartDate) marks[ds] = { startingDay: true, color: '#00D4FF', textColor: 'white' };
                    else if (ds === selectedEndDate) marks[ds] = { endingDay: true, color: '#00D4FF', textColor: 'white' };
                    else marks[ds] = { color: '#00D4FF', textColor: 'white', opacity: 0.5 };
                });
            }
        }
        return marks;
    }, [selectedStartDate, selectedEndDate]);

    // Availability Logic
    const availableUnits = useMemo(() => {
        if (!selectedStartDate || !selectedEndDate || calculating) return [];

        const start = new Date(selectedStartDate).getTime();
        const end = new Date(selectedEndDate).getTime();

        return offer.details.units.map(unit => {
            // Count overlaps
            const overlaps = bookings.filter(b => {
                if (b.unitId !== unit.id) return false;
                // Check date overlap: (StartA <= EndB) and (EndA >= StartB)
                return (b.startDate < end) && (b.endDate > start);
                // Note: booking range usually checkout is exclusive or checkin is inclusive?
                // Simplification for MVP: Typical hotel logic -> night stay.
                // If I book 1st to 2nd. B: 1st-2nd. Overlap.
            }).length;

            const remaining = unit.quantity - overlaps;
            return { ...unit, remaining };
        }).filter(u => u.remaining > 0);
    }, [selectedStartDate, selectedEndDate, bookings, calculating, offer.details.units]);

    const handleBookPress = (unit: AccommodationUnit) => {
        if (!currentUser) {
            Alert.alert("Login Required", "Please log in to book.");
            return;
        }
        setSelectedUnit(unit);
        setModalVisible(true);
    };

    const handleCreateReservation = async (contact: UserAddress, saveAddress: boolean) => {
        if (!selectedUnit || !selectedStartDate || !selectedEndDate || !currentUser) return;

        const startTimestamp = new Date(selectedStartDate).getTime();
        const endTimestamp = new Date(selectedEndDate).getTime();
        const nights = Math.max(1, Math.ceil((endTimestamp - startTimestamp) / (1000 * 60 * 60 * 24))); // Min 1 night
        const totalPrice = selectedUnit.pricePerNight * nights;

        const reservationDate: Omit<Reservation, 'id'> = {
            offerId: offer.id,
            offerTitle: offer.title,
            offerImage: offer.images[0] || "",
            providerId: offer.providerId,
            clientId: currentUser.uid,
            unitId: selectedUnit.id,
            unitName: selectedUnit.name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            startDate: startTimestamp,
            endDate: endTimestamp,
            totalPrice,
            guestCount: selectedUnit.capacity.adults + selectedUnit.capacity.children, // Defaulting to max capacity for now or add input
            status: 'PENDING',
            contactDetails: contact
        };

        await firestore().collection('bookings').add(reservationDate);

        if (saveAddress) {
            await firestore().collection('users').doc(currentUser.uid).update({ savedAddress: contact });
        }

        Alert.alert("Success", "Booking request sent!", [{ text: "OK" }]);
        // Refresh bookings to update availability
        fetchBookings();
    };

    const nightCount = selectedStartDate && selectedEndDate
        ? Math.max(1, Math.ceil((new Date(selectedEndDate).getTime() - new Date(selectedStartDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    if (userRole === 'PROVIDER') {
        return (
            <View className="mx-4 my-6 bg-yellow-500/20 border border-yellow-500/50 p-4 rounded-xl flex-row items-center">
                <Ionicons name="warning-outline" size={24} color="#FACC15" />
                <Text className="text-yellow-400 font-bold ml-3 flex-1">
                    As a provider, you cannot book accommodation offers.
                </Text>
            </View>
        );
    }

    return (
        <View className="py-6">
            <Text className="text-white font-bold text-lg mb-4 px-4">Check Availability</Text>

            <View className="mx-4 rounded-xl overflow-hidden border border-slate-700 mb-6">
                <Calendar
                    onDayPress={onDayPress}
                    markingType={'period'}
                    markedDates={markedDates}
                    theme={{
                        backgroundColor: '#0f172a',
                        calendarBackground: '#0f172a',
                        textSectionTitleColor: '#94a3b8',
                        selectedDayBackgroundColor: '#00D4FF',
                        selectedDayTextColor: '#ffffff',
                        todayTextColor: '#00D4FF',
                        dayTextColor: '#ffffff',
                        textDisabledColor: '#334155',
                        dotColor: '#00adf5',
                        selectedDotColor: '#ffffff',
                        arrowColor: '#00D4FF',
                        monthTextColor: '#ffffff',
                        indicatorColor: 'blue',
                    }}
                />
            </View>

            {calculating && <ActivityIndicator color="#00D4FF" className="mb-4" />}

            {selectedStartDate && selectedEndDate ? (
                <View className="px-4">
                    <Text className="text-slate-400 text-xs mb-2 uppercase font-bold">Available Units ({nightCount} nights)</Text>
                    {availableUnits.length > 0 ? (
                        availableUnits.map(unit => (
                            <View key={unit.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
                                <View className="flex-row">
                                    <Image source={{ uri: unit.images?.[0] }} style={{ width: 80, height: 80, borderRadius: 8 }} contentFit="cover" />
                                    <View className="flex-1 ml-3 justify-between">
                                        <View>
                                            <Text className="text-white font-bold text-lg">{unit.name}</Text>
                                            <Text className="text-slate-400 text-xs">{unit.type.replace('_', ' ')} • Max {unit.capacity.adults} Adults</Text>
                                        </View>
                                        <View className="flex-row justify-between items-end">
                                            <Text className="text-neon-primary font-bold">{offer.currency} {unit.pricePerNight * nightCount} <Text className="text-slate-500 font-normal text-xs">total</Text></Text>
                                            <TouchableOpacity
                                                onPress={() => handleBookPress(unit)}
                                                className="bg-neon-primary px-4 py-2 rounded-lg"
                                            >
                                                <Text className="text-white font-bold text-xs">Book</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text className="text-slate-500 italic">No units available for selected dates.</Text>
                    )}
                </View>
            ) : (
                <View className="px-4 py-8 items-center border border-dashed border-slate-700 rounded-xl mx-4">
                    <Ionicons name="calendar-clear-outline" size={40} color="#475569" />
                    <Text className="text-slate-500 mt-2">Select check-in and check-out dates</Text>
                </View>
            )}

            {selectedUnit && (
                <BookingModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    onSubmit={handleCreateReservation}
                    unitName={selectedUnit.name}
                    totalPrice={selectedUnit.pricePerNight * nightCount}
                    currency={offer.currency}
                    dates={`${selectedStartDate} to ${selectedEndDate}`}
                />
            )}
        </View>
    );
}
