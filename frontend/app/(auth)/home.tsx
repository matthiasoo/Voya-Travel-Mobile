import { Stack } from "expo-router";
import { View, Text, Button } from "react-native";
import auth from "@react-native-firebase/auth";

const Page = () => {
    return (
        <View className="flex-1 gap-2 items-center justify-center bg-background">
            <Text className="p-2 text-5xl text-primary font-bold">Voya Travel</Text>
            <Button title="Log out" onPress={() => auth().signOut()} />
        </View>
    );
};

export default Page;