import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface StrokeButtonProps extends TouchableOpacityProps {
    title: string;
    colors?: [string, string, ...string[]];
}

export function StrokeButton({ title, colors = ['#7F00FF', '#00D4FF'], className, ...props }: StrokeButtonProps) {
    return (
        <TouchableOpacity className={`${className}`} {...props}>
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-[1.5px] rounded-xl overflow-hidden"
            >
                <View className="bg-void-surface overflow-hidden rounded-xl p-4 items-center">
                    <Text className="text-neon-secondary font-bold text-lg">{title}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
}
