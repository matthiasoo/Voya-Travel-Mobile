import { TextInput, TextInputProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface GradientInputProps extends TextInputProps {
    colors?: [string, string, ...string[]];
    icon?: ReactNode;
}

export function GradientInput({ colors = ['#7F00FF', '#00D4FF'], icon, className, style, ...props }: GradientInputProps) {
    const { isHighContrast } = useAccessibility();

    if (isHighContrast) {
        return (
            <View className={`border-2 border-white rounded-xl overflow-hidden ${className}`}>
                <View className="bg-black rounded-xl flex-row items-center">
                    {icon && (
                        <View className="pl-4">
                            {icon}
                        </View>
                    )}
                    <TextInput
                        className={`flex-1 p-4 text-white placeholder:text-gray-500 ${icon ? 'pl-3' : ''}`}
                        placeholderTextColor="#6B7280"
                        {...props}
                    />
                </View>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className={`p-[1.5px] rounded-xl overflow-hidden ${className}`}
        >
            <View className="bg-void-surface rounded-xl flex-row items-center">
                {icon && (
                    <View className="pl-4">
                        {icon}
                    </View>
                )}
                <TextInput
                    className={`flex-1 p-4 text-text-main placeholder:text-text-muted/50 ${icon ? 'pl-3' : ''}`}
                    placeholderTextColor="#8F90A6"
                    {...props}
                />
            </View>
        </LinearGradient>
    );
}

