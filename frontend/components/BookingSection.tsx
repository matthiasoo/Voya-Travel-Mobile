import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput } from "react-native";
import { useState, useCallback, useMemo, useEffect } from "react";
import { Calendar, DateData } from "react-native-calendars";
import { format, eachDayOfInterval } from "date-fns";
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

    // Tour specific state
    const [guestCount, setGuestCount] = useState(1);

    const currentUser = auth().currentUser;
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
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
    }, [currentUser]);

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

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const onDayPress = (day: DateData) => {
        const dateString = day.dateString;

        if (offer.type === 'TOURS') {
            // Single date selection for tours
            setSelectedStartDate(dateString);
            setSelectedEndDate(dateString); // Same day for simplicity in logic
            return;
        }

        // Accommodation range selection
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

        // Mark available dates for Tours if provided
        if (offer.type === 'TOURS' && offer.details.startDates && offer.details.startDates.length > 0) {
            // If we have specific start dates, we could mark them.
            // But parsing might be tricky if they are not YYYY-MM-DD.
            // For now, let's rely on user selecting a date.
        }

        if (selectedStartDate) {
            marks[selectedStartDate] = { startingDay: true, color: '#00D4FF', textColor: 'white' };
            if (selectedEndDate) {
                if (offer.type === 'TOURS') {
                    marks[selectedStartDate] = { selected: true, color: '#00D4FF', textColor: 'white' };
                } else {
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
        }
        return marks;
    }, [selectedStartDate, selectedEndDate, offer]);

    // Availability Logic
    const availableUnits = useMemo(() => {
        if (offer.type !== 'ACCOMMODATION') return [];
        if (!selectedStartDate || !selectedEndDate || calculating) return [];

        const start = new Date(selectedStartDate).getTime();
        const end = new Date(selectedEndDate).getTime();

        return offer.details.units.map(unit => {
            // Count overlaps
            const overlaps = bookings.filter(b => {
                if (b.unitId !== unit.id) return false;
                // Check date overlap: (StartA <= EndB) and (EndA >= StartB)
                return (b.startDate < end) && (b.endDate > start);
            }).length;

            const remaining = unit.quantity - overlaps;
            return { ...unit, remaining };
        }).filter(u => u.remaining > 0);
    }, [selectedStartDate, selectedEndDate, bookings, calculating, offer]);

    // Tour Availability Logic
    const tourAvailability = useMemo(() => {
        if (offer.type !== 'TOURS') return null;
        if (!selectedStartDate) return null;

        const start = new Date(selectedStartDate).getTime();

        // Sum guests for this date
        const bookedGuests = bookings.filter(b => {
            // Check if same day. 
            // Note: b.startDate is timestamp. We should compare dates roughly.
            // Assuming startDate is stored as midnight timestamp for tours.
            return isSameDay(b.startDate, start);
        }).reduce((acc, b) => acc + (b.guestCount || 1), 0);

        const remaining = offer.details.maxParticipants - bookedGuests;
        return { remaining, isAvailable: remaining >= guestCount };
    }, [selectedStartDate, bookings, guestCount, offer]);

    // Helper to check same day (simple version if date-fns input is timestamp/date)
    const isSameDay = (ts1: number, ts2: number) => {
        const d1 = new Date(ts1);
        const d2 = new Date(ts2);
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };


    const handleBookPress = (unit: AccommodationUnit | null) => {
        if (!currentUser) {
            Alert.alert("Login Required", "Please log in to book.");
            return;
        }
        if (offer.type === 'ACCOMMODATION') {
            setSelectedUnit(unit);
        } else {
            // For tours, unit is null
            setSelectedUnit(null);
        }
        setModalVisible(true);
    };

    const handleCreateReservation = async (contact: UserAddress, saveAddress: boolean) => {
        if (!selectedStartDate || (offer.type === 'ACCOMMODATION' && !selectedEndDate) || !currentUser) return;
        if (offer.type === 'ACCOMMODATION' && !selectedUnit) return;

        const startTimestamp = new Date(selectedStartDate).getTime();
        const endTimestamp = offer.type === 'TOURS'
            ? startTimestamp // Same day for tours? Or + duration? Let's use startTimestamp for end too or logic dependent
            : new Date(selectedEndDate!).getTime();

        const nights = offer.type === 'TOURS' ? 1 : Math.max(1, Math.ceil((endTimestamp - startTimestamp) / (1000 * 60 * 60 * 24)));

        const totalPrice = offer.type === 'TOURS'
            ? offer.price * guestCount
            : (selectedUnit?.pricePerNight || 0) * nights;

        const reservationDate: Omit<Reservation, 'id'> = {
            offerId: offer.id,
            offerTitle: offer.title,
            offerImage: offer.images[0] || "",
            providerId: offer.providerId,
            clientId: currentUser.uid,
            unitId: offer.type === 'TOURS' ? 'TOUR' : selectedUnit!.id,
            unitName: offer.type === 'TOURS' ? `Tour (${guestCount} ppl)` : selectedUnit!.name,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            startDate: startTimestamp,
            endDate: endTimestamp,
            totalPrice,
            guestCount: offer.type === 'TOURS' ? guestCount : (selectedUnit!.capacity.adults + selectedUnit!.capacity.children), // Approximation for accommodation
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
                    As a provider, you cannot book offers.
                </Text>
            </View>
        );
    }

    return (
        <View className="py-6">
            <Text className="text-white font-bold text-lg mb-4 px-4">{offer.type === 'TOURS' ? 'Select Date & Participants' : 'Check Availability'}</Text>

            <View className="mx-4 rounded-xl overflow-hidden border border-slate-700 mb-6">
                <Calendar
                    onDayPress={onDayPress}
                    markingType={offer.type === 'TOURS' ? 'simple' : 'period'}
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

            {selectedStartDate && (offer.type === 'TOURS' || selectedEndDate) ? (
                <View className="px-4">
                    {offer.type === 'ACCOMMODATION' ? (
                        <>
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
                        </>
                    ) : (
                        // TOUR UI
                        <View className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
                            <Text className="text-white font-bold text-lg mb-2">Booking Details</Text>
                            <Text className="text-slate-300 mb-4">Date: {selectedStartDate}</Text>

                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-slate-400">Participants</Text>
                                <View className="flex-row items-center border border-slate-600 rounded-lg">
                                    <TouchableOpacity
                                        onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
                                        className="p-2 border-r border-slate-600"
                                    >
                                        <Ionicons name="remove" size={20} color="white" />
                                    </TouchableOpacity>
                                    <Text className="text-white font-bold px-4">{guestCount}</Text>
                                    <TouchableOpacity
                                        onPress={() => setGuestCount(Math.min(offer.details.maxParticipants, guestCount + 1))}
                                        className="p-2 border-l border-slate-600"
                                    >
                                        <Ionicons name="add" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {tourAvailability && tourAvailability.isAvailable ? (
                                <View className="mt-2">
                                    <View className="flex-row justify-between items-center mb-4">
                                        <Text className="text-slate-400">Total Price</Text>
                                        <Text className="text-neon-primary font-bold text-xl">{offer.currency} {offer.price * guestCount}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleBookPress(null)}
                                        className="bg-neon-primary w-full p-3 rounded-lg items-center"
                                    >
                                        <Text className="text-white font-bold">Book Now</Text>
                                    </TouchableOpacity>
                                    <Text className="text-slate-500 text-xs text-center mt-2">{tourAvailability.remaining} spots remaining</Text>
                                </View>
                            ) : (
                                <View className="bg-red-500/10 p-3 rounded-lg border border-red-500/50">
                                    <Text className="text-red-400 text-center font-bold">Not enough spots available.</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            ) : (
                <View className="px-4 py-8 items-center border border-dashed border-slate-700 rounded-xl mx-4">
                    <Ionicons name="calendar-clear-outline" size={40} color="#475569" />
                    <Text className="text-slate-500 mt-2">{offer.type === 'TOURS' ? 'Select a date' : 'Select check-in and check-out dates'}</Text>
                </View>
            )}

            <BookingModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleCreateReservation}
                unitName={offer.type === 'TOURS' ? `Tour (${guestCount} people)` : selectedUnit?.name || ""}
                totalPrice={offer.type === 'TOURS' ? offer.price * guestCount : (selectedUnit?.pricePerNight || 0) * nightCount}
                currency={offer.currency}
                dates={offer.type === 'TOURS' ? selectedStartDate || "" : `${selectedStartDate} to ${selectedEndDate}`}
            />
        </View>
    );
}
