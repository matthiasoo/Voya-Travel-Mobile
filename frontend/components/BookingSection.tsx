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
import { useAccessibility } from "../contexts/AccessibilityContext";

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
    const { isHighContrast } = useAccessibility();

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
        const selectionColor = isHighContrast ? '#FACC15' : '#00D4FF';
        const selectionTextColor = isHighContrast ? 'black' : 'white';

        if (selectedStartDate) {
            marks[selectedStartDate] = { startingDay: true, color: selectionColor, textColor: selectionTextColor };
            if (selectedEndDate) {
                if (offer.type === 'TOURS') {
                    marks[selectedStartDate] = { selected: true, color: selectionColor, textColor: selectionTextColor };
                } else {
                    const start = new Date(selectedStartDate);
                    const end = new Date(selectedEndDate);
                    const days = eachDayOfInterval({ start, end });
                    days.forEach(d => {
                        const ds = format(d, 'yyyy-MM-dd');
                        if (ds === selectedStartDate) marks[ds] = { startingDay: true, color: selectionColor, textColor: selectionTextColor };
                        else if (ds === selectedEndDate) marks[ds] = { endingDay: true, color: selectionColor, textColor: selectionTextColor };
                        else marks[ds] = { color: selectionColor, textColor: selectionTextColor, opacity: isHighContrast ? 1 : 0.5 };
                    });
                }
            }
        }
        return marks;
    }, [selectedStartDate, selectedEndDate, offer, isHighContrast]);

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

    // Helper to check same day (simple version if date-fns input is timestamp/date)
    const isSameDay = (ts1: number, ts2: number) => {
        const d1 = new Date(ts1);
        const d2 = new Date(ts2);
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

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
            <View className={`mx-4 my-6 p-4 rounded-xl flex-row items-center border ${isHighContrast
                ? 'bg-neutral-800 border-yellow-400'
                : 'bg-yellow-500/20 border-yellow-500/50'
                }`}>
                <Ionicons name="warning-outline" size={24} color={isHighContrast ? "#FACC15" : "#FACC15"} />
                <Text className={`font-bold ml-3 flex-1 ${isHighContrast ? 'text-yellow-400' : 'text-yellow-400'}`}>
                    As a provider, you cannot book offers.
                </Text>
            </View>
        );
    }

    return (
        <View className="py-6">
            <Text className="text-white font-bold text-lg mb-4 px-4">{offer.type === 'TOURS' ? 'Select Date & Participants' : 'Check Availability'}</Text>

            <View className={`mx-4 rounded-xl overflow-hidden mb-6 border ${isHighContrast ? 'border-2 border-white' : 'border-slate-700'
                }`}>
                <Calendar
                    onDayPress={onDayPress}
                    markingType={(offer.type === 'TOURS' ? 'simple' : 'period') as any}
                    markedDates={markedDates}
                    theme={{
                        backgroundColor: isHighContrast ? '#000000' : '#0f172a',
                        calendarBackground: isHighContrast ? '#000000' : '#0f172a',
                        textSectionTitleColor: isHighContrast ? '#ffffff' : '#94a3b8',
                        selectedDayBackgroundColor: isHighContrast ? '#FACC15' : '#00D4FF',
                        selectedDayTextColor: isHighContrast ? '#000000' : '#ffffff',
                        todayTextColor: isHighContrast ? '#FACC15' : '#00D4FF',
                        dayTextColor: '#ffffff',
                        textDisabledColor: '#334155',
                        dotColor: isHighContrast ? '#FACC15' : '#00adf5',
                        selectedDotColor: isHighContrast ? '#000000' : '#ffffff',
                        arrowColor: isHighContrast ? '#FACC15' : '#00D4FF',
                        monthTextColor: '#ffffff',
                        indicatorColor: 'blue',
                    }}
                />
            </View>

            {calculating && <ActivityIndicator color={isHighContrast ? "#FACC15" : "#00D4FF"} className="mb-4" />}

            {selectedStartDate && (offer.type === 'TOURS' || selectedEndDate) ? (
                <View className="px-4">
                    {offer.type === 'ACCOMMODATION' ? (
                        <>
                            <Text className={`text-xs mb-2 uppercase font-bold ${isHighContrast ? 'text-white' : 'text-slate-400'}`}>Available Units ({nightCount} nights)</Text>
                            {availableUnits.length > 0 ? (
                                availableUnits.map(unit => (
                                    <View key={unit.id} className={`p-4 rounded-xl border mb-4 ${isHighContrast
                                        ? 'bg-black border-2 border-white'
                                        : 'bg-slate-800 border-slate-700'
                                        }`}>
                                        <View className="flex-row">
                                            <Image source={{ uri: unit.images?.[0] }} style={{ width: 80, height: 80, borderRadius: 8 }} contentFit="cover" />
                                            <View className="flex-1 ml-3 justify-between">
                                                <View>
                                                    <Text className="text-white font-bold text-lg">{unit.name}</Text>
                                                    <Text className={`text-xs ${isHighContrast ? 'text-white' : 'text-slate-400'}`}>{unit.type.replace('_', ' ')} • Max {unit.capacity.adults} Adults</Text>
                                                </View>
                                                <View className="flex-row justify-between items-end">
                                                    <Text className={`font-bold ${isHighContrast ? 'text-white' : 'text-neon-primary'}`}>{offer.currency} {unit.pricePerNight * nightCount} <Text className={`font-normal text-xs ${isHighContrast ? 'text-white' : 'text-slate-500'}`}>total</Text></Text>
                                                    <TouchableOpacity
                                                        onPress={() => handleBookPress(unit)}
                                                        className={`px-4 py-2 rounded-lg ${isHighContrast ? 'bg-yellow-400' : 'bg-neon-primary'}`}
                                                    >
                                                        <Text className={`font-bold text-xs ${isHighContrast ? 'text-black' : 'text-white'}`}>Book</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text className={isHighContrast ? "text-white italic" : "text-slate-500 italic"}>No units available for selected dates.</Text>
                            )}
                        </>
                    ) : (
                        // TOUR UI
                        <View className={`p-4 rounded-xl border mb-4 ${isHighContrast
                            ? 'bg-black border-2 border-white'
                            : 'bg-slate-800 border-slate-700'
                            }`}>
                            <Text className="text-white font-bold text-lg mb-2">Booking Details</Text>
                            <Text className={isHighContrast ? "text-white mb-4" : "text-slate-300 mb-4"}>Date: {selectedStartDate}</Text>

                            <View className="flex-row justify-between items-center mb-4">
                                <Text className={isHighContrast ? "text-white" : "text-slate-400"}>Participants</Text>
                                <View className={`flex-row items-center border rounded-lg ${isHighContrast ? 'border-white' : 'border-slate-600'
                                    }`}>
                                    <TouchableOpacity
                                        onPress={() => setGuestCount(Math.max(1, guestCount - 1))}
                                        className={`p-2 border-r ${isHighContrast ? 'border-white' : 'border-slate-600'}`}
                                    >
                                        <Ionicons name="remove" size={20} color="white" />
                                    </TouchableOpacity>
                                    <Text className="text-white font-bold px-4">{guestCount}</Text>
                                    <TouchableOpacity
                                        onPress={() => setGuestCount(Math.min(offer.details.maxParticipants, guestCount + 1))}
                                        className={`p-2 border-l ${isHighContrast ? 'border-white' : 'border-slate-600'}`}
                                    >
                                        <Ionicons name="add" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {tourAvailability && tourAvailability.isAvailable ? (
                                <View className="mt-2">
                                    <View className="flex-row justify-between items-center mb-4">
                                        <Text className={isHighContrast ? "text-white" : "text-slate-400"}>Total Price</Text>
                                        <Text className={`font-bold text-xl ${isHighContrast ? 'text-white' : 'text-neon-primary'}`}>{offer.currency} {offer.price * guestCount}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleBookPress(null)}
                                        className={`w-full p-3 rounded-lg items-center ${isHighContrast ? 'bg-yellow-400' : 'bg-neon-primary'
                                            }`}
                                    >
                                        <Text className={`font-bold ${isHighContrast ? 'text-black' : 'text-white'}`}>Book Now</Text>
                                    </TouchableOpacity>
                                    <Text className={`text-xs text-center mt-2 ${isHighContrast ? 'text-white' : 'text-slate-500'}`}>{tourAvailability.remaining} spots remaining</Text>
                                </View>
                            ) : (
                                <View className={`p-3 rounded-lg border ${isHighContrast ? 'bg-neutral-800 border-red-400' : 'bg-red-500/10 border-red-500/50'
                                    }`}>
                                    <Text className="text-red-400 text-center font-bold">Not enough spots available.</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            ) : (
                <View className={`px-4 py-8 items-center border border-dashed rounded-xl mx-4 ${isHighContrast ? 'border-white' : 'border-slate-700'
                    }`}>
                    <Ionicons name="calendar-clear-outline" size={40} color={isHighContrast ? "#fff" : "#475569"} />
                    <Text className={isHighContrast ? "text-white mt-2" : "text-slate-500 mt-2"}>{offer.type === 'TOURS' ? 'Select a date' : 'Select check-in and check-out dates'}</Text>
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

