import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAccessibility } from '../contexts/AccessibilityContext';

interface GradientButtonProps extends TouchableOpacityProps {
    title: string;
    colors?: [string, string, ...string[]];
}

export function GradientButton({ title, colors = ['#7F00FF', '#00D4FF'], className, ...props }: GradientButtonProps) {
    const { isHighContrast } = useAccessibility();

    if (isHighContrast) {
        return (
            <TouchableOpacity
                className={`rounded-xl overflow-hidden bg-yellow-400 p-4 items-center ${className}`}
                {...props}
            >
                <Text className="text-black font-bold text-lg">{title}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity className={`rounded-xl overflow-hidden ${className}`} {...props}>
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-4 items-center"
            >
                <Text className="text-white font-bold text-lg">{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
}

