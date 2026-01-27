import { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
    ExpoSpeechRecognitionModule,
    useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface VoiceSearchButtonProps {
    onResult: (text: string) => void;
    disabled?: boolean;
}

type VoiceState = 'idle' | 'listening' | 'processing';

export function VoiceSearchButton({ onResult, disabled = false }: VoiceSearchButtonProps) {
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.6)).current;

    // Speech recognition event listeners
    useSpeechRecognitionEvent('start', () => {
        setVoiceState('listening');
    });

    useSpeechRecognitionEvent('end', () => {
        setVoiceState('idle');
    });

    useSpeechRecognitionEvent('result', (event) => {
        const transcript = event.results[0]?.transcript;
        if (transcript) {
            onResult(transcript);
        }
    });

    useSpeechRecognitionEvent('error', (event) => {
        console.log('Voice search error:', event.error, event.message);
        setVoiceState('idle');
    });

    // Pulse animation when listening
    useEffect(() => {
        if (voiceState === 'listening') {
            const pulseAnimation = Animated.loop(
                Animated.parallel([
                    Animated.sequence([
                        Animated.timing(pulseAnim, {
                            toValue: 1.2,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                        Animated.timing(pulseAnim, {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.sequence([
                        Animated.timing(opacityAnim, {
                            toValue: 1,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                        Animated.timing(opacityAnim, {
                            toValue: 0.6,
                            duration: 600,
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            );
            pulseAnimation.start();
            return () => pulseAnimation.stop();
        } else {
            pulseAnim.setValue(1);
            opacityAnim.setValue(0.6);
        }
    }, [voiceState, pulseAnim, opacityAnim]);

    const handlePress = async () => {
        if (disabled) return;

        if (voiceState === 'listening') {
            ExpoSpeechRecognitionModule.stop();
            return;
        }

        try {
            // Request permissions
            const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!result.granted) {
                console.warn('Voice search permissions not granted');
                return;
            }

            // Start speech recognition with Polish language
            ExpoSpeechRecognitionModule.start({
                lang: 'pl-PL',
                interimResults: false,
                continuous: false,
            });
        } catch (error) {
            console.error('Failed to start voice search:', error);
            setVoiceState('idle');
        }
    };

    const isListening = voiceState === 'listening';

    return (
        <TouchableOpacity
            onPress={handlePress}
            disabled={disabled}
            className="h-[52px] w-[52px] rounded-xl overflow-hidden"
            activeOpacity={0.7}
        >
            <Animated.View
                style={{
                    transform: [{ scale: pulseAnim }],
                    width: '100%',
                    height: '100%',
                }}
            >
                <LinearGradient
                    colors={isListening ? ['#FF6B6B', '#FF8E53'] : ['#7F00FF', '#00D4FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-full h-full p-[1.5px] items-center justify-center rounded-xl"
                >
                    <Animated.View
                        style={{ opacity: isListening ? opacityAnim : 1 }}
                        className={`w-full h-full rounded-xl items-center justify-center ${isListening ? 'bg-slate-900/80' : 'bg-slate-900/90'
                            }`}
                    >
                        <Ionicons
                            name={isListening ? 'mic' : 'mic-outline'}
                            size={24}
                            color={isListening ? '#FF6B6B' : '#00D4FF'}
                        />
                        {isListening && (
                            <View className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                    </Animated.View>
                </LinearGradient>
            </Animated.View>
        </TouchableOpacity>
    );
}
