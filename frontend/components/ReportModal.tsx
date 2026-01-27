import { View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { GradientButton } from "./GradientButton";
import { ReportReason } from "../types/report";
import { ReportService } from "../services/reports";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

interface ReportModalProps {
    visible: boolean;
    onClose: () => void;
    targetId: string;
    targetType: 'OFFER' | 'USER' | 'REVIEW';
    targetName?: string;
}

const REASONS: { label: string; value: ReportReason }[] = [
    { label: "Spam or Scam", value: "SPAM" },
    { label: "Harassment or Hate Speech", value: "HARASSMENT" },
    { label: "Inappropriate Content", value: "INAPPROPRIATE" },
    { label: "Violence or Dangerous", value: "VIOLENCE" },
    { label: "Other", value: "OTHER" },
];

export function ReportModal({ visible, onClose, targetId, targetType, targetName }: ReportModalProps) {
    const [reason, setReason] = useState<ReportReason | null>(null);
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason) {
            Alert.alert("Required", "Please select a reason for reporting.");
            return;
        }

        const user = auth().currentUser;
        if (!user) {
            Alert.alert("Login Required", "You must be logged in to report content.");
            return;
        }

        setSubmitting(true);
        try {
            await ReportService.createReport(
                targetId,
                targetType,
                user.uid,
                reason,
                description,
                targetName
            );
            Alert.alert("Report Sent", "Thank you for reporting. We will review this content shortly.");
            onClose();
            // Reset form
            setReason(null);
            setDescription("");
        } catch (error) {
            console.error("Failed to submit report:", error);
            Alert.alert("Error", "Failed to submit report. Please try again.");
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
                <View className="bg-slate-900 rounded-t-3xl border-t border-slate-700 p-6 h-[80%]">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-bold text-white">Report {targetType === 'OFFER' ? 'Offer' : targetType === 'USER' ? 'User' : 'Content'}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text className="text-slate-300 mb-4">Why are you reporting this?</Text>

                        <View className="gap-3 mb-6">
                            {REASONS.map((r) => (
                                <TouchableOpacity
                                    key={r.value}
                                    onPress={() => setReason(r.value)}
                                    className={`p-4 rounded-xl border flex-row justify-between items-center ${reason === r.value
                                            ? 'bg-red-500/20 border-red-500'
                                            : 'bg-slate-800 border-slate-700'
                                        }`}
                                >
                                    <Text className={`font-semibold ${reason === r.value ? 'text-white' : 'text-slate-300'}`}>
                                        {r.label}
                                    </Text>
                                    {reason === r.value && (
                                        <Ionicons name="checkmark-circle" size={20} color="#F87171" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text className="text-slate-300 mb-2 font-medium">Description (Optional)</Text>
                        <View className="bg-slate-800 rounded-xl p-4 mb-6 border border-slate-700">
                            <TextInput
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Please provide more details..."
                                placeholderTextColor="#64748B"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                className="text-white h-24"
                            />
                        </View>

                        <GradientButton
                            onPress={handleSubmit}
                            title={submitting ? "Submitting..." : "Submit Report"}
                            disabled={submitting || !reason}
                        />
                        <View className="h-10" />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
