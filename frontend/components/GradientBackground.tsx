import { LinearGradient } from 'expo-linear-gradient';
import { View, ScrollView } from 'react-native';
import { ReactNode } from 'react';

interface GradientBackgroundProps {
    children: ReactNode;
    variant?: 'centered' | 'full';
}

export const GradientBackground = ({ children, variant = 'centered' }: GradientBackgroundProps) => {
    if (variant === 'full') {
        return (
            <LinearGradient
                colors={['#060514ff', '#080627ff']}
                className="flex-1 p-6 pt-20"
            >
                <View className="flex-1 w-full max-w-md self-center">
                    {children}
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#060514ff', '#080627ff']}
            className="flex-1 items-center justify-center p-6 pt-20"
        >
            <View className="w-full max-w-md gap-6">
                {children}
            </View>
        </LinearGradient>
    );
};
