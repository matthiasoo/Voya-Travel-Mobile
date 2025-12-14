import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { ReactNode } from 'react';

interface GradientBackgroundProps {
    children: ReactNode;
}

export const GradientBackground = ({ children }: GradientBackgroundProps) => {
    return (
        <LinearGradient
            colors={['#060514ff', '#080627ff']}
            className="flex-1 items-center justify-center p-6"
        >
            <View className="w-full max-w-md gap-6">
                {children}
            </View>
        </LinearGradient>
    );
};
