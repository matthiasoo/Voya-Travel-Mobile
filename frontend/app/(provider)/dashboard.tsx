import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { GradientBackground } from "../../components/GradientBackground";
import { useState, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { ProviderUser } from "../../types/user";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Reservation } from "../../types/reservation";
import { Offer } from "../../types/offer";

interface DashboardStats {
    totalBookings: number;
    pendingBookings: number;
    activeBookings: number;
    completedBookings: number;
    totalRevenue: number;
    totalOffers: number;
    averageRating: number;
    totalReviews: number;
}

export default function DashboardScreen() {
    const [user, setUser] = useState<ProviderUser | null>(null);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentBookings, setRecentBookings] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const currentUser = auth().currentUser;
        if (!currentUser) return;

        
        const unsubUser = firestore()
            .collection('users')
            .doc(currentUser.uid)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    setUser(doc.data() as ProviderUser);
                }
            });

        
        const unsubBookings = firestore()
            .collection('bookings')
            .where('providerId', '==', currentUser.uid)
            .onSnapshot(async (snapshot) => {
                const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));

                
                const pending = bookings.filter(b => b.status === 'PENDING').length;
                const active = bookings.filter(b => b.status === 'ACCEPTED').length;
                const completed = bookings.filter(b => b.status === 'COMPLETED').length;
                const revenue = bookings
                    .filter(b => b.status === 'COMPLETED' || b.status === 'ACCEPTED')
                    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

                
                const recent = bookings
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .slice(0, 5);
                setRecentBookings(recent);

                
                const offersSnapshot = await firestore()
                    .collection('offers')
                    .where('providerId', '==', currentUser.uid)
                    .get();

                const offers = offersSnapshot.docs.map(doc => doc.data() as Offer);
                const totalOffers = offers.length;

                
                const offersWithRating = offers.filter(o => o.rating > 0);
                const avgRating = offersWithRating.length > 0
                    ? offersWithRating.reduce((sum, o) => sum + o.rating, 0) / offersWithRating.length
                    : 0;
                const totalReviews = offers.reduce((sum, o) => sum + (o.reviewsCount || 0), 0);

                setStats({
                    totalBookings: bookings.length,
                    pendingBookings: pending,
                    activeBookings: active,
                    completedBookings: completed,
                    totalRevenue: revenue,
                    totalOffers,
                    averageRating: avgRating,
                    totalReviews
                });

                setLoading(false);
            });

        return () => {
            unsubUser();
            unsubBookings();
        };
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-500/20 text-yellow-400';
            case 'ACCEPTED': return 'bg-green-500/20 text-green-400';
            case 'COMPLETED': return 'bg-blue-500/20 text-blue-400';
            case 'REJECTED': return 'bg-red-500/20 text-red-400';
            case 'CANCELLED': return 'bg-slate-500/20 text-slate-400';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    };

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
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="pt-12 px-4 pb-24 gap-6">
                    <Text className="text-3xl font-bold text-white">Dashboard</Text>

                    {}
                    <View className="flex-row flex-wrap gap-3">
                        {}
                        <View className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex-1 min-w-[45%]">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="w-8 h-8 rounded-full bg-neon-primary/20 items-center justify-center">
                                    <Ionicons name="calendar" size={16} color="#00D4FF" />
                                </View>
                                <Text className="text-slate-400 text-xs">Bookings</Text>
                            </View>
                            <Text className="text-white text-2xl font-bold">{stats?.totalBookings || 0}</Text>
                            <View className="flex-row gap-2 mt-1">
                                <Text className="text-yellow-400 text-xs">{stats?.pendingBookings} pending</Text>
                                <Text className="text-green-400 text-xs">{stats?.activeBookings} active</Text>
                            </View>
                        </View>

                        {}
                        <View className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex-1 min-w-[45%]">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="w-8 h-8 rounded-full bg-green-500/20 items-center justify-center">
                                    <Ionicons name="cash" size={16} color="#22C55E" />
                                </View>
                                <Text className="text-slate-400 text-xs">Revenue</Text>
                            </View>
                            <Text className="text-white text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</Text>
                            <Text className="text-slate-500 text-xs mt-1">from {stats?.completedBookings} completed</Text>
                        </View>

                        {}
                        <View className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex-1 min-w-[45%]">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center">
                                    <Ionicons name="storefront" size={16} color="#A855F7" />
                                </View>
                                <Text className="text-slate-400 text-xs">My Offers</Text>
                            </View>
                            <Text className="text-white text-2xl font-bold">{stats?.totalOffers || 0}</Text>
                            <Text className="text-slate-500 text-xs mt-1">active listings</Text>
                        </View>

                        {}
                        <View className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex-1 min-w-[45%]">
                            <View className="flex-row items-center gap-2 mb-2">
                                <View className="w-8 h-8 rounded-full bg-yellow-500/20 items-center justify-center">
                                    <Ionicons name="star" size={16} color="#FBBF24" />
                                </View>
                                <Text className="text-slate-400 text-xs">Rating</Text>
                            </View>
                            <Text className="text-white text-2xl font-bold">
                                {stats?.averageRating ? stats.averageRating.toFixed(1) : '—'}
                            </Text>
                            <Text className="text-slate-500 text-xs mt-1">{stats?.totalReviews || 0} reviews</Text>
                        </View>
                    </View>

                    {}
                    <View>
                        <Text className="text-white font-bold text-lg mb-3">Quick Actions</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => router.push('/offer/create-property')}
                                className="bg-neon-primary/20 border border-neon-primary/50 p-4 rounded-xl flex-1 items-center gap-2"
                            >
                                <Ionicons name={user?.category === 'TOURS' ? 'compass' : 'add-circle'} size={28} color="#00D4FF" />
                                <Text className="text-white font-bold text-sm">
                                    {user?.category === 'TOURS' ? 'Add Tour' : 'Add Property'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push('/(provider)/my-offers')}
                                className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex-1 items-center gap-2"
                            >
                                <Ionicons name="list" size={28} color="#94A3B8" />
                                <Text className="text-white font-bold text-sm">My Offers</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push('/(provider)/reservations')}
                                className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex-1 items-center gap-2"
                            >
                                <Ionicons name="calendar" size={28} color="#94A3B8" />
                                <Text className="text-white font-bold text-sm">Bookings</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {}
                    {recentBookings.length > 0 && (
                        <View>
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-white font-bold text-lg">Recent Bookings</Text>
                                <TouchableOpacity onPress={() => router.push('/(provider)/reservations')}>
                                    <Text className="text-neon-primary text-sm">See all</Text>
                                </TouchableOpacity>
                            </View>
                            <View className="gap-2">
                                {recentBookings.map((booking) => (
                                    <View key={booking.id} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex-row justify-between items-center">
                                        <View className="flex-1">
                                            <Text className="text-white font-bold" numberOfLines={1}>{booking.offerTitle}</Text>
                                            <Text className="text-slate-400 text-xs">{booking.unitName}</Text>
                                        </View>
                                        <View className="items-end">
                                            <View className={`px-2 py-0.5 rounded ${getStatusColor(booking.status).split(' ')[0]}`}>
                                                <Text className={`text-xs font-bold ${getStatusColor(booking.status).split(' ')[1]}`}>
                                                    {booking.status}
                                                </Text>
                                            </View>
                                            <Text className="text-neon-primary font-bold text-sm mt-1">
                                                {formatCurrency(booking.totalPrice)}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {recentBookings.length === 0 && (
                        <View className="bg-slate-800/30 p-6 rounded-xl border border-dashed border-slate-700 items-center">
                            <Ionicons name="calendar-outline" size={48} color="#475569" />
                            <Text className="text-slate-400 mt-2 text-center">No bookings yet</Text>
                            <Text className="text-slate-500 text-sm text-center">When customers book your offers, they'll appear here</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </GradientBackground>
    );
}
