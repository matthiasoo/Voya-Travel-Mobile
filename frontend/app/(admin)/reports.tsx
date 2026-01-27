import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from "react-native";
import { useState, useEffect } from "react";
import firestore from "@react-native-firebase/firestore";
import { GradientBackground } from "../../components/GradientBackground";
import { Report } from "../../types/report";
import { ReportService } from "../../services/reports";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

export default function AdminReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'PENDING' | 'RESOLVED' | 'DISMISSED'>('PENDING');

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('reports')
            .where('status', '==', filter)
            .orderBy('createdAt', 'desc')
            .onSnapshot((querySnapshot) => {
                const reportsData: Report[] = [];
                querySnapshot.forEach(doc => {
                    reportsData.push(doc.data() as Report);
                });
                setReports(reportsData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching reports: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, [filter]);

    const handleDismiss = async (reportId: string) => {
        try {
            await ReportService.updateReportStatus(reportId, 'DISMISSED', 'No violation found');
            Alert.alert("Report Dismissed");
        } catch (error) {
            Alert.alert("Error", "Failed to dismiss report");
        }
    };

    const handleBlockUser = async (reportId: string, userId: string) => {
        try {
            // Block logic: Update user status to BLOCKED (assuming field exists or using verificationStatus)
            await firestore().collection('users').doc(userId).update({
                verificationStatus: 'BLOCKED'
            });
            await ReportService.updateReportStatus(reportId, 'RESOLVED', 'User Blocked');
            Alert.alert("User Blocked", "User has been blocked successfully.");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to block user");
        }
    };

    const handleHideOffer = async (reportId: string, offerId: string) => {
        try {
            await firestore().collection('offers').doc(offerId).update({
                verificationStatus: 'REJECTED' // Hiding the offer
            });
            await ReportService.updateReportStatus(reportId, 'RESOLVED', 'Offer Hidden');
            Alert.alert("Offer Hidden", "Offer has been rejected/hidden.");
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to hide offer");
        }
    };

    const handleBanReview = async (reportId: string, reviewId: string) => {
        try {
            await firestore().collection('reviews').doc(reviewId).delete(); // Or update status to HIDDEN
            await ReportService.updateReportStatus(reportId, 'RESOLVED', 'Review Deleted');
            Alert.alert("Review Deleted");
        } catch (error) {
            Alert.alert("Error", "Failed to delete review");
        }
    };

    const renderReportItem = ({ item }: { item: Report }) => (
        <View className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 mb-3">
            <View className="flex-row justify-between mb-2">
                <View className="flex-row items-center gap-2">
                    <Ionicons
                        name={item.reason === 'SPAM' ? 'warning' : item.reason === 'VIOLENCE' ? 'alert-circle' : 'flag'}
                        size={20}
                        color="#F87171"
                    />
                    <Text className="text-red-400 font-bold">{item.reason}</Text>
                </View>
                <Text className="text-slate-500 text-xs">{format(item.createdAt, 'MMM d, HH:mm')}</Text>
            </View>

            <Text className="text-white font-bold mb-1">Target: {item.targetType} {item.targetName ? `(${item.targetName})` : ''}</Text>
            {item.description ? (
                <Text className="text-slate-300 italic mb-3">"{item.description}"</Text>
            ) : (
                <Text className="text-slate-500 italic mb-3">No description provided.</Text>
            )}

            <View className="flex-row gap-2 mt-2 pt-2 border-t border-slate-700">
                <TouchableOpacity
                    onPress={() => handleDismiss(item.id)}
                    className="flex-1 bg-slate-700 p-2 rounded-lg items-center"
                >
                    <Text className="text-white font-bold text-xs">Dismiss</Text>
                </TouchableOpacity>

                {item.targetType === 'USER' && (
                    <TouchableOpacity
                        onPress={() => handleBlockUser(item.id, item.targetId)}
                        className="flex-1 bg-red-500/20 border border-red-500 p-2 rounded-lg items-center"
                    >
                        <Text className="text-red-400 font-bold text-xs">Block User</Text>
                    </TouchableOpacity>
                )}

                {item.targetType === 'OFFER' && (
                    <TouchableOpacity
                        onPress={() => handleHideOffer(item.id, item.targetId)}
                        className="flex-1 bg-red-500/20 border border-red-500 p-2 rounded-lg items-center"
                    >
                        <Text className="text-red-400 font-bold text-xs">Hide Offer</Text>
                    </TouchableOpacity>
                )}

                {item.targetType === 'REVIEW' && (
                    <TouchableOpacity
                        onPress={() => handleBanReview(item.id, item.targetId)}
                        className="flex-1 bg-red-500/20 border border-red-500 p-2 rounded-lg items-center"
                    >
                        <Text className="text-red-400 font-bold text-xs">Delete Review</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <GradientBackground variant="full">
            <View className="flex-1 p-4 pt-12">
                <Text className="text-2xl font-bold text-white mb-6">Moderation Reports</Text>

                {/* Filter Tabs */}
                <View className="flex-row mb-6 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
                    {(['PENDING', 'RESOLVED', 'DISMISSED'] as const).map(status => (
                        <TouchableOpacity
                            key={status}
                            onPress={() => setFilter(status)}
                            className={`flex-1 py-2 rounded-lg items-center ${filter === status ? 'bg-slate-700' : ''}`}
                        >
                            <Text className={`font-bold text-xs ${filter === status ? 'text-white' : 'text-slate-400'}`}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#00D4FF" />
                ) : (
                    <FlatList
                        data={reports}
                        renderItem={renderReportItem}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center py-10 opacity-50">
                                <Ionicons name="shield-checkmark-outline" size={48} color="white" />
                                <Text className="text-white text-lg font-bold mt-2">No reports found</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </GradientBackground>
    );
}
