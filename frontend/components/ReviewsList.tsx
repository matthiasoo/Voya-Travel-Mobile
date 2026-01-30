import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { useEffect, useState } from "react";
import { Review } from "../types/review";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { ReportModal } from "./ReportModal";

interface ReviewsListProps {
    offerId: string;
}

export function ReviewsList({ offerId }: ReviewsListProps) {
    
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportReviewObj, setReportReviewObj] = useState<Review | null>(null);
    const { isHighContrast } = useAccessibility();

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
        <View className={`p-4 rounded-xl border mb-3 ${isHighContrast
            ? 'bg-black border-2 border-white'
            : 'bg-slate-800/50 border-slate-700/50'
            }`}>
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                    <View className={`w-8 h-8 rounded-full overflow-hidden items-center justify-center ${isHighContrast ? 'bg-neutral-800 border border-white' : 'bg-slate-700'
                        }`}>
                        {item.userAvatar ? (
                            <Image source={{ uri: item.userAvatar }} style={{ width: 32, height: 32 }} contentFit="cover" />
                        ) : (
                            <Text className="text-white font-bold text-xs">{item.userName.charAt(0)}</Text>
                        )}
                    </View>
                    <View>
                        <Text className="text-white font-bold text-sm">{item.userName}</Text>
                        <Text className={`text-xs ${isHighContrast ? 'text-white' : 'text-slate-500'}`}>{format(item.createdAt, 'MMM d, yyyy')}</Text>
                    </View>
                </View>

                <View className="flex-row gap-0.5 items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons
                            key={star}
                            name="star"
                            size={12}
                            color={isHighContrast ? "white" : (item.rating >= star ? "#FBBF24" : "#334155")}
                        />
                    ))}
                    {auth().currentUser?.uid !== item.userId && (
                        <TouchableOpacity
                            onPress={() => setReportReviewObj(item)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            className="ml-2 opacity-50"
                        >
                            <Ionicons name="flag-outline" size={14} color={isHighContrast ? "red" : "#94a3b8"} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <Text className={`text-sm ${isHighContrast ? 'text-white' : 'text-slate-300'}`}>{item.content}</Text>
        </View>
    );

    if (loading) return null; 

    if (reviews.length === 0) {
        return (
            <View className="py-8 items-center">
                <Text className={isHighContrast ? "text-white italic" : "text-slate-500 italic"}>No reviews yet.</Text>
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

            {reportReviewObj && (
                <ReportModal
                    visible={!!reportReviewObj}
                    onClose={() => setReportReviewObj(null)}
                    targetId={reportReviewObj.id}
                    targetType="REVIEW"
                    targetName={`Review by ${reportReviewObj.userName}`}
                />
            )}
        </View>
    );
}

