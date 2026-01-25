import { View, Text, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import firestore from "@react-native-firebase/firestore";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Review } from "../types/review";

interface ReviewListProps {
    offerId: string;
}

export function ReviewList({ offerId }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('reviews')
            .where('offerId', '==', offerId)
            // .orderBy('createdAt', 'desc') // Requires index, might fail without it. Client side sort safer for MVP if small data.
            .onSnapshot(snapshot => {
                const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
                // Client-side sort to avoid index requirements error during demo
                fetched.sort((a, b) => b.createdAt - a.createdAt);
                setReviews(fetched);
                setLoading(false);
            }, err => {
                console.error("Error fetching reviews:", err);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [offerId]);

    if (loading) {
        return <ActivityIndicator color="#00D4FF" />;
    }

    if (reviews.length === 0) {
        return (
            <View className="py-4">
                <Text className="text-slate-500 italic">No reviews yet.</Text>
            </View>
        );
    }

    return (
        <View className="gap-4">
            {reviews.map(review => (
                <View key={review.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-row items-center gap-2">
                            <View className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center overflow-hidden">
                                {review.userAvatar ? (
                                    <Image source={{ uri: review.userAvatar }} style={{ width: 32, height: 32 }} />
                                ) : (
                                    <Text className="text-white font-bold">{review.userName.charAt(0)}</Text>
                                )}
                            </View>
                            <View>
                                <Text className="text-white font-bold text-sm">{review.userName}</Text>
                                <Text className="text-slate-500 text-xs">{new Date(review.createdAt).toLocaleDateString()}</Text>
                            </View>
                        </View>
                        <View className="flex-row items-center bg-slate-900 px-2 py-1 rounded-lg">
                            <Ionicons name="star" size={12} color="#FACC15" />
                            <Text className="text-white font-bold ml-1 text-xs">{review.rating}</Text>
                        </View>
                    </View>
                    <Text className="text-slate-300 text-sm leading-5">{review.comment}</Text>
                </View>
            ))}
        </View>
    );
}
