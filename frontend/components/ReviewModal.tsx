import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";

interface ReviewModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (rating: number, comment: string) => Promise<void>;
}

export function ReviewModal({ visible, onClose, onSubmit }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setSubmitting(true);
        try {
            await onSubmit(rating, comment);
            setRating(0);
            setComment("");
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableWithoutFeedback onPress={onClose}>
                <View className="flex-1 bg-black/70 justify-center items-center p-4">
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                            className="w-full"
                        >
                            <View className="bg-slate-900 p-6 rounded-2xl border border-slate-700 w-full">
                                <Text className="text-white text-xl font-bold text-center mb-6">Rate your experience</Text>

                                {/* Stars */}
                                <View className="flex-row justify-center gap-2 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity key={star} onPress={() => setRating(star)}>
                                            <Ionicons
                                                name={rating >= star ? "star" : "star-outline"}
                                                size={32}
                                                color="#FACC15"
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Comment */}
                                <View className="mb-6">
                                    <Text className="text-slate-400 text-xs mb-2 uppercase font-bold">Comment (Optional)</Text>
                                    <TextInput
                                        className="bg-slate-800 text-white p-4 rounded-xl border border-slate-700 min-h-[100px]"
                                        placeholder="Share your experience..."
                                        placeholderTextColor="#64748b"
                                        multiline
                                        textAlignVertical="top"
                                        value={comment}
                                        onChangeText={setComment}
                                    />
                                </View>

                                {/* Actions */}
                                <View className="flex-row gap-4">
                                    <TouchableOpacity
                                        onPress={onClose}
                                        className="flex-1 p-4 bg-slate-800 rounded-xl items-center"
                                        disabled={submitting}
                                    >
                                        <Text className="text-slate-300 font-bold">Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSubmit}
                                        className={`flex-1 p-4 rounded-xl items-center ${rating > 0 ? 'bg-neon-primary' : 'bg-slate-700'}`}
                                        disabled={submitting || rating === 0}
                                    >
                                        {submitting ? (
                                            <ActivityIndicator color="white" />
                                        ) : (
                                            <Text className={`font-bold ${rating > 0 ? 'text-white' : 'text-slate-500'}`}>Submit</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}
