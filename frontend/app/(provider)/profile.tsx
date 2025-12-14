import { View, Text, Button } from "react-native";
import auth from "@react-native-firebase/auth";

export default function ProfileScreen() {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="text-2xl text-primary font-bold">Company Profile</Text>
            <Text className="text-foreground">Company details.</Text>
            <Button title="Log out" onPress={() => auth().signOut()} />
        </View>
    );
}
