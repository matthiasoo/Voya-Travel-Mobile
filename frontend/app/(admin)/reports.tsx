import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useState, useEffect, useMemo } from "react";
import firestore from "@react-native-firebase/firestore";
import { GradientBackground } from "../../components/GradientBackground";
import { Ionicons } from "@expo/vector-icons";
import { Report } from "../../types/report";
import { format } from "date-fns";
import { Image } from "expo-image";
import { ReportService } from "../../services/reports";

interface GroupedReport {
    targetId: string;
    targetType: 'OFFER' | 'USER' | 'REVIEW';
    targetName?: string;
    reports: Report[];
    lastReportDate: number;
}

export default function AdminReportsScreen() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCase, setSelectedCase] = useState<GroupedReport | null>(null);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('reports')
            .where('status', '==', 'PENDING')
            .onSnapshot(snapshot => {
                const data: Report[] = [];
                snapshot.forEach(doc => data.push(doc.data() as Report));
                setReports(data);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const groupedReports = useMemo(() => {
        const groups: Record<string, GroupedReport> = {};

        reports.forEach(report => {
            if (!groups[report.targetId]) {
                groups[report.targetId] = {
                    targetId: report.targetId,
                    targetType: report.targetType,
                    targetName: report.targetName || 'Unknown Target',
                    reports: [],
                    lastReportDate: 0
                };
            }
            groups[report.targetId].reports.push(report);
            groups[report.targetId].lastReportDate = Math.max(groups[report.targetId].lastReportDate, report.createdAt);
        });

        return Object.values(groups).sort((a, b) => b.lastReportDate - a.lastReportDate);
    }, [reports]);

    const handleAction = async (action: 'BLOCK_USER' | 'HIDE_OFFER' | 'DISMISS') => {
        if (!selectedCase) return;

        try {
            if (action === 'BLOCK_USER') {
                await firestore().collection('users').doc(selectedCase.targetId).update({ status: 'BLOCKED' });
                Alert.alert("Success", "User has been blocked.");
            } else if (action === 'HIDE_OFFER') {
                await firestore().collection('offers').doc(selectedCase.targetId).update({
                    verificationStatus: 'REJECTED',
                    isActive: false
                });
                Alert.alert("Success", "Offer has been hidden/rejected.");
            }

            
            const status = action === 'DISMISS' ? 'DISMISS' : 'RESOLVED';
            
            const finalStatus = action === 'DISMISS' ? 'DISMISS' : 'RESOLVED';
            

            
            const promises = selectedCase.reports.map(r =>
                ReportService.updateReportStatus(r.id, action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED', action)
            );
            await Promise.all(promises);

            setSelectedCase(null);

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Action failed.");
        }
    };

    const renderCase = ({ item }: { item: GroupedReport }) => (
        <TouchableOpacity
            onPress={() => setSelectedCase(item)}
            className="bg-slate-800 p-4 rounded-xl mb-3 border border-slate-700 mx-4"
        >
            <View className="flex-row justify-between items-start">
                <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                        <View className={`px-2 py-0.5 rounded text-xs ${item.targetType === 'USER' ? 'bg-blue-500/20' :
                            item.targetType === 'OFFER' ? 'bg-purple-500/20' : 'bg-gray-500/20'
                            }`}>
                            <Text className={`${item.targetType === 'USER' ? 'text-blue-400' :
                                item.targetType === 'OFFER' ? 'text-purple-400' : 'text-gray-400'
                                } text-[10px] font-bold`}>{item.targetType}</Text>
                        </View>
                        <Text className="text-slate-400 text-xs">{format(item.lastReportDate, 'MMM d, HH:mm')}</Text>
                    </View>
                    <Text className="text-white font-bold text-lg">{item.targetName}</Text>
                    <Text className="text-slate-400 text-sm mt-1">{item.reports.length} pending reports</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#64748B" />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <GradientBackground variant="full">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#00D4FF" />
                </View>
            </GradientBackground>
        );
    }

    if (selectedCase) {
        return (
            <GradientBackground variant="full">
                <View className="flex-1">
                    {}
                    <View className="flex-row items-center p-4 border-b border-slate-800">
                        <TouchableOpacity onPress={() => setSelectedCase(null)} className="mr-4">
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-white flex-1" numberOfLines={1}>{selectedCase.targetName}</Text>
                    </View>

                    <ScrollView className="flex-1 p-4">
                        <View className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6">


                            <Text className="text-slate-400 text-xs uppercase mb-2">Reports ({selectedCase.reports.length})</Text>
                            {selectedCase.reports.map((report, idx) => (
                                <View key={report.id} className="mb-3 pb-3 border-b border-slate-800 last:border-0 last:pb-0 last:mb-0">
                                    <View className="flex-row justify-between mb-1">
                                        <Text className="text-red-400 font-bold text-xs">{report.reason}</Text>
                                        <Text className="text-slate-500 text-[10px]">{format(report.createdAt, 'MMM d')}</Text>
                                    </View>
                                    <Text className="text-slate-300 text-sm">{report.description || "No description provided."}</Text>
                                </View>
                            ))}
                        </View>

                        <Text className="text-white font-bold text-lg mb-3">Actions</Text>

                        <View className="gap-3">
                            <TouchableOpacity
                                onPress={() => handleAction('DISMISS')}
                                className="w-full bg-slate-700 p-4 rounded-xl items-center border border-slate-600"
                            >
                                <Text className="text-white font-bold">Dismiss All Reports</Text>
                            </TouchableOpacity>

                            {selectedCase.targetType === 'USER' && (
                                <TouchableOpacity
                                    onPress={() => handleAction('BLOCK_USER')}
                                    className="w-full bg-red-500/20 p-4 rounded-xl items-center border border-red-500"
                                >
                                    <Text className="text-red-400 font-bold">Block User</Text>
                                </TouchableOpacity>
                            )}

                            {selectedCase.targetType === 'OFFER' && (
                                <TouchableOpacity
                                    onPress={() => handleAction('HIDE_OFFER')}
                                    className="w-full bg-orange-500/20 p-4 rounded-xl items-center border border-orange-500"
                                >
                                    <Text className="text-orange-400 font-bold">Hide Offer</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </ScrollView>
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground variant="full">
            <View className="flex-1">
                <Text className="text-2xl font-bold text-white p-4 pt-12">Moderation Queue</Text>

                <FlatList
                    data={groupedReports}
                    renderItem={renderCase}
                    keyExtractor={item => item.targetId}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center py-20 opacity-50">
                            <Ionicons name="checkmark-circle-outline" size={64} color="#94A3B8" />
                            <Text className="text-slate-400 mt-4">All caught up! No pending reports.</Text>
                        </View>
                    }
                />
            </View>
        </GradientBackground>
    );
}
