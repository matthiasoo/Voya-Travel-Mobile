import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { useState, useEffect } from "react";
import firestore from "@react-native-firebase/firestore";
import { GradientBackground } from "../../components/GradientBackground";
import { ProviderUser } from "../../types/user";

export default function AdminApprovals() {
    const [providers, setProviders] = useState<ProviderUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection('users')
            .where('role', '==', 'PROVIDER')
            .where('verificationStatus', '==', 'UNVERIFIED')
            .onSnapshot((querySnapshot) => {
                const unverifiedProviders: ProviderUser[] = [];
                querySnapshot.forEach(doc => {
                    unverifiedProviders.push(doc.data() as ProviderUser);
                });
                setProviders(unverifiedProviders);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching unverified providers: ", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (uid: string) => {
        try {
            await firestore().collection('users').doc(uid).update({
                verificationStatus: 'VERIFIED'
            });
            // No need to manually update state, onSnapshot will handle it
        } catch (error) {
            console.error("Error approving provider:", error);
            Alert.alert("Error", "Failed to approve provider.");
        }
    };

    const handleReject = async (uid: string) => {
        try {
            await firestore().collection('users').doc(uid).update({
                verificationStatus: 'REJECTED'
            });
            // No need to manually update state, onSnapshot will handle it
        } catch (error) {
            console.error("Error rejecting provider:", error);
            Alert.alert("Error", "Failed to reject provider.");
        }
    };

    const renderProviderItem = ({ item }: { item: ProviderUser }) => (
        <View className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 mb-3">
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-xl font-bold text-white">{item.companyName}</Text>
                    <Text className="text-sm text-text-muted">{item.firstName} {item.lastName}</Text>
                </View>
                <View className="bg-yellow-500/20 px-2 py-1 rounded border border-yellow-500/50">
                    <Text className="text-yellow-400 text-xs font-bold">UNVERIFIED</Text>
                </View>
            </View>

            <Text className="text-gray-300 mb-1">Category: <Text className="text-neon-primary">{item.category}</Text></Text>
            <Text className="text-gray-300 mb-3">Email: {item.email}</Text>

            <View className="flex-row gap-2 mt-2">
                <TouchableOpacity
                    onPress={() => handleApprove(item.uid)}
                    className="flex-1 bg-green-500/20 border border-green-500 p-3 rounded-lg items-center active:bg-green-500/30"
                >
                    <Text className="text-green-400 font-bold">Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => handleReject(item.uid)}
                    className="flex-1 bg-red-500/20 border border-red-500 p-3 rounded-lg items-center active:bg-red-500/30"
                >
                    <Text className="text-red-400 font-bold">Reject</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <GradientBackground variant="full">
            <View className="flex-1 p-4 pt-12">
                <Text className="text-2xl font-bold text-white mb-6">Pending Approvals</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#00D4FF" />
                ) : providers.length === 0 ? (
                    <View className="flex-1 items-center justify-center opacity-50">
                        <Text className="text-white text-lg font-bold">No pending approvals</Text>
                        <Text className="text-text-muted">All providers are verified.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={providers}
                        renderItem={renderProviderItem}
                        keyExtractor={item => item.uid}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}
            </View>
        </GradientBackground>
    );
}
