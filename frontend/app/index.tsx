import { View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            const user = auth().currentUser;
            if (!user) {
                
                router.replace('/(auth)/login');
            } else {
                
                try {
                    const userDoc = await firestore().collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        if (userData?.role === 'PROVIDER') {
                            router.replace('/(provider)/profile');
                        } else if (userData?.role === 'ADMIN') {
                            router.replace('/(admin)/approvals');
                        } else {
                            router.replace('/(tourist)');
                        }
                    } else {
                        
                        router.replace('/(auth)/baseuser-setup');
                    }
                } catch (error) {
                    console.error("Error checking user role:", error);
                    
                    
                }
            }
        };

        
        setTimeout(checkUser, 100);
    }, []);

    return (
        <View className="flex-1 items-center justify-center bg-background">
            <Image
                source={require('../assets/icon.png')}
                style={{ width: 120, height: 120, borderRadius: 24, marginBottom: 32 }}
                contentFit="contain"
            />
            <ActivityIndicator size="large" color="#3B82F6" />
        </View>
    );
}