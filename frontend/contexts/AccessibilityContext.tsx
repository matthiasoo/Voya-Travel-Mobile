import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HIGH_CONTRAST_KEY = '@voya_high_contrast';

interface AccessibilityContextType {
    isHighContrast: boolean;
    toggleHighContrast: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
    isHighContrast: false,
    toggleHighContrast: () => { },
});

export const useAccessibility = () => useContext(AccessibilityContext);

interface AccessibilityProviderProps {
    children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
    const [isHighContrast, setIsHighContrast] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    
    useEffect(() => {
        const loadPreference = async () => {
            try {
                const stored = await AsyncStorage.getItem(HIGH_CONTRAST_KEY);
                if (stored !== null) {
                    setIsHighContrast(stored === 'true');
                }
            } catch (error) {
                console.error('Failed to load high contrast preference:', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadPreference();
    }, []);

    
    const toggleHighContrast = async () => {
        try {
            const newValue = !isHighContrast;
            setIsHighContrast(newValue);
            await AsyncStorage.setItem(HIGH_CONTRAST_KEY, String(newValue));
        } catch (error) {
            console.error('Failed to save high contrast preference:', error);
        }
    };

    
    if (!isLoaded) {
        return null;
    }

    return (
        <AccessibilityContext.Provider value={{ isHighContrast, toggleHighContrast }}>
            {children}
        </AccessibilityContext.Provider>
    );
}


export const highContrastColors = {
    background: '#000000',
    surface: '#1a1a1a',
    foreground: '#FFFFFF',
    primary: '#00FFFF',      
    secondary: '#FFFF00',    
    accent: '#FF00FF',       
    text: {
        main: '#FFFFFF',
        muted: '#CCCCCC',
    },
    border: '#FFFFFF',
    success: '#00FF00',
    error: '#FF0000',
};


export const useColors = () => {
    const { isHighContrast } = useAccessibility();

    return {
        bg: isHighContrast ? 'bg-black' : 'bg-void',
        surface: isHighContrast ? 'bg-neutral-900' : 'bg-void-surface',
        text: isHighContrast ? 'text-white' : 'text-text-main',
        textMuted: isHighContrast ? 'text-gray-300' : 'text-text-muted',
        border: isHighContrast ? 'border-white' : 'border-neon-secondary',
        primary: isHighContrast ? 'text-cyan-400' : 'text-neon-primary',
        primaryBg: isHighContrast ? 'bg-cyan-400' : 'bg-neon-primary',
    };
};
