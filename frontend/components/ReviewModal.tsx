import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { GradientButton } from "./GradientButton";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { AIService } from "../services/ai";

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    offerId: string;
    reservationId: string;
    onSuccess: () => void;
}

export function ReviewModal({ visible, onClose, offerId, reservationId, onSuccess }: ReviewModalProps) {
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setSubmitting(true);

        try {
            // AI Safety Check
            const safetyResult = await AIService.checkContentSafety(content);
            if (!safetyResult.safe) {
                Alert.alert(
                    "Content Warning",
                    `Your review contains content that may violate our safety guidelines${safetyResult.reason ? `: ${safetyResult.reason}` : '.'}\nPlease revise it.`
                );
                setSubmitting(false);
                return;
            }

            const user = auth().currentUser;
            if (!user) return;

            // Fetch user profile to get the real name
            let userName = user.displayName || "Anonymous";
            let userAvatar = user.photoURL || null;

            try {
                const userDoc = await firestore().collection('users').doc(user.uid).get();
                const exists = typeof userDoc.exists === 'function' ? userDoc.exists() : userDoc.exists;
                console.log('User document exists:', exists);
                if (exists) {
                    const userData = userDoc.data();
                    console.log('User data:', userData);

                    // Check for fullName first, then try firstName + lastName
                    if (userData?.fullName) {
                        userName = userData.fullName;
                        console.log('Set userName from fullName:', userName);
                    } else if (userData?.firstName || userData?.lastName) {
                        userName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                        console.log('Set userName from firstName + lastName:', userName);
                    } else {
                        console.log('No name fields in user data');
                    }

                    if (userData?.photoURL) userAvatar = userData.photoURL;
                } else {
                    console.log('User document does not exist for uid:', user.uid);
                }
            } catch (err) {
                console.error("Could not fetch user profile for review:", err);
            }

            // 1. Create Review Document
            const reviewRef = firestore().collection('reviews').doc();
            await reviewRef.set({
                id: reviewRef.id,
                offerId,
                userId: user.uid,
                userName,
                userAvatar,
                rating,
                content,
                createdAt: Date.now()
            });

            // 2. Mark Reservation as Reviewed
            await firestore().collection('bookings').doc(reservationId).update({
                hasReviewed: true
            });

            // 3. Update Offer Average Rating (Simplified Transaction)
            const offerRef = firestore().collection('offers').doc(offerId);

            await firestore().runTransaction(async (transaction) => {
                const offerDoc = await transaction.get(offerRef);
                if (!offerDoc.exists) return;

                const data = offerDoc.data();
                const currentRating = data?.rating || 0;
                const currentCount = data?.reviewsCount || 0;

                const newCount = currentCount + 1;
                // Calculate new running average
                const newRating = ((currentRating * currentCount) + rating) / newCount;

                transaction.update(offerRef, {
                    rating: newRating,
                    reviewsCount: newCount
                });
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error submitting review:", error);
            Alert.alert("Error", "Failed to submit review. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/60">
                <View className="bg-slate-900 rounded-t-3xl border-t border-slate-700 p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-white">Rate your stay</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                <Ionicons
                                    name={rating >= star ? "star" : "star-outline"}
                                    size={40}
                                    color={rating >= star ? "#FBBF24" : "#475569"}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text className="text-slate-300 mb-2 font-medium">Write a review</Text>
                    <View className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
                        <TextInput
                            value={content}
                            onChangeText={setContent}
                            placeholder="Share your experience..."
                            placeholderTextColor="#64748B"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="text-white h-24"
                        />
                    </View>

                    <GradientButton
                        onPress={handleSubmit}
                        title={submitting ? "Submitting..." : "Submit Review"}
                        disabled={submitting || !content.trim()}
                    />
                    <View className="h-6" />
                </View>
            </View>
        </Modal>
    );
}
