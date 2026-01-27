import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {

    return {
        ...config,
        name: config.name || "frontend",
        slug: config.slug || "frontend",
        plugins: [
            ...(config.plugins || []),
            [
                "expo-speech-recognition",
                {
                    "microphonePermission": "Zezwól $(PRODUCT_NAME) na użycie mikrofonu do wyszukiwania głosowego.",
                    "speechRecognitionPermission": "Zezwól $(PRODUCT_NAME) na rozpoznawanie mowy do wyszukiwania ofert.",
                    "androidSpeechServicePackages": ["com.google.android.googlequicksearchbox"]
                }
            ]
        ],
        android: {
            ...config.android,
            permissions: [
                "ACCESS_COARSE_LOCATION",
                "ACCESS_FINE_LOCATION",
                "ACCESS_BACKGROUND_LOCATION",
                "FOREGROUND_SERVICE",
                "FOREGROUND_SERVICE_LOCATION",
                "RECORD_AUDIO"
            ],
            config: {
                ...config.android?.config,
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY,
                },
            },
        }
    };
};
