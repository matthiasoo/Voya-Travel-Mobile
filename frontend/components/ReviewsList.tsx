import { View, Text, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { Review } from "../types/review";
import firestore from "@react-native-firebase/firestore";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

interface ReviewsListProps {
    offerId: string;
}

export function ReviewsList({ offerId }: ReviewsListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('reviews')
            .where('offerId', '==', offerId)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .onSnapshot(snapshot => {
                const reviewsData: Review[] = [];
                snapshot.forEach(doc => {
                    reviewsData.push(doc.data() as Review);
                });
                setReviews(reviewsData);
                setLoading(false);
            }, err => {
                console.error("Error fetching reviews:", err);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [offerId]);

    const renderReview = ({ item }: { item: Review }) => (
        <View className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-3">
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden items-center justify-center">
                        {item.userAvatar ? (
                            <Image source={{ uri: item.userAvatar }} style={{ width: 32, height: 32 }} contentFit="cover" />
                        ) : (
                            <Text className="text-white font-bold text-xs">{item.userName.charAt(0)}</Text>
                        )}
                    </View>
                    <View>
                        <Text className="text-white font-bold text-sm">{item.userName}</Text>
                        <Text className="text-slate-500 text-xs">{format(item.createdAt, 'MMM d, yyyy')}</Text>
                    </View>
                </View>
                <View className="flex-row gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons
                            key={star}
                            name="star"
                            size={12}
                            color={item.rating >= star ? "#FBBF24" : "#334155"}
                        />
                    ))}
                </View>
            </View>
            <Text className="text-slate-300 text-sm">{item.content}</Text>
        </View>
    );

    if (loading) return null; // Or a skeleton

    if (reviews.length === 0) {
        return (
            <View className="py-8 items-center">
                <Text className="text-slate-500 italic">No reviews yet.</Text>
            </View>
        );
    }

    return (
        <View className="mt-4">
            <Text className="text-white font-bold text-lg mb-3">Reviews ({reviews.length})</Text>
            {reviews.map(review => (
                <View key={review.id}>
                    {renderReview({ item: review })}
                </View>
            ))}
        </View>
    );
}
