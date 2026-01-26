import { View, Text, Modal, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useState, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { GradientButton } from "./GradientButton";
import { GradientInput } from "./GradientInput";

export interface FilterState {
    minPrice: string;
    maxPrice: string;
    types: string[]; // 'HOTEL', 'APARTMENT', 'TOURS'
    amenities: string[];
    sortBy: 'price_asc' | 'price_desc' | 'rating' | null;
}

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    initialFilters: FilterState;
}

export function FilterModal({ visible, onClose, onApply, initialFilters }: FilterModalProps) {
    const [filters, setFilters] = useState<FilterState>(initialFilters);

    useEffect(() => {
        if (visible) {
            setFilters(initialFilters);
        }
    }, [visible, initialFilters]);

    const toggleType = (type: string) => {
        setFilters(prev => {
            const types = prev.types.includes(type)
                ? prev.types.filter(t => t !== type)
                : [...prev.types, type];
            return { ...prev, types };
        });
    };

    const toggleAmenity = (amenity: string) => {
        setFilters(prev => {
            const amenities = prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity];
            return { ...prev, amenities };
        });
    };

    const handleReset = () => {
        setFilters({
            minPrice: '',
            maxPrice: '',
            types: [],
            amenities: [],
            sortBy: null
        });
    };

    const handleApply = () => {
        onApply(filters);
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/60">
                <View className="bg-slate-900 rounded-t-3xl border-t border-slate-700 h-[85%] w-full flex overflow-hidden">
                    {/* Header */}
                    <View className="relative">
                        <View className="flex-row items-center justify-between p-5 z-10">
                            <TouchableOpacity onPress={handleReset}>
                                <Text className="text-slate-400 font-medium">Reset</Text>
                            </TouchableOpacity>
                            <Text className="text-xl font-bold text-white">Filters</Text>
                            <TouchableOpacity onPress={onClose} className="bg-slate-800 p-2 rounded-full">
                                <Ionicons name="close" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                        <LinearGradient
                            colors={['#7F00FF', '#00D4FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ height: 1, width: '100%', opacity: 0.3 }}
                        />
                    </View>

                    <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                        {/* Price Range */}
                        <View className="mb-6">
                            <Text className="text-white font-bold mb-3 text-lg">Price Range</Text>
                            <View className="flex-row gap-4">
                                <View className="flex-1">
                                    <GradientInput
                                        placeholder="Min"
                                        value={filters.minPrice}
                                        onChangeText={(text) => setFilters(prev => ({ ...prev, minPrice: text }))}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View className="flex-1">
                                    <GradientInput
                                        placeholder="Max"
                                        value={filters.maxPrice}
                                        onChangeText={(text) => setFilters(prev => ({ ...prev, maxPrice: text }))}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Property Type */}
                        <View className="mb-6">
                            <Text className="text-white font-bold mb-3 text-lg">Type</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {['HOTEL', 'APARTMENT', 'TOURS'].map(type => {
                                    const isActive = filters.types.includes(type);
                                    return (
                                        <TouchableOpacity
                                            key={type}
                                            onPress={() => toggleType(type)}
                                            className="rounded-lg overflow-hidden"
                                        >
                                            <LinearGradient
                                                colors={isActive ? ['#7F00FF', '#00D4FF'] : ['#1E293B', '#1E293B']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                className="p-[1px] rounded-lg"
                                            >
                                                <View className={`px-4 py-2.5 rounded-lg ${isActive ? 'bg-slate-900/90' : 'bg-slate-800'}`}>
                                                    <Text className={isActive ? 'text-white font-bold shadow-neon' : 'text-slate-300'}>
                                                        {type === 'TOURS' ? 'Tours' : type.charAt(0) + type.slice(1).toLowerCase()}
                                                    </Text>
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Amenities */}
                        <View className="mb-6">
                            <Text className="text-white font-bold mb-3 text-lg">Amenities</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {['Wifi', 'Parking', 'Pool', 'Gym', 'Air Conditioning', 'Breakfast'].map(amenity => {
                                    const isActive = filters.amenities.includes(amenity);
                                    return (
                                        <TouchableOpacity
                                            key={amenity}
                                            onPress={() => toggleAmenity(amenity)}
                                            className="rounded-lg overflow-hidden"
                                        >
                                            <LinearGradient
                                                colors={isActive ? ['#7F00FF', '#00D4FF'] : ['#1E293B', '#1E293B']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                className="p-[1px] rounded-lg"
                                            >
                                                <View className={`px-4 py-2.5 rounded-lg ${isActive ? 'bg-slate-900/90' : 'bg-slate-800'}`}>
                                                    <Text className={isActive ? 'text-white font-bold shadow-neon' : 'text-slate-300'}>
                                                        {amenity}
                                                    </Text>
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Sorting */}
                        <View className="mb-6">
                            <Text className="text-white font-bold mb-3 text-lg">Sort By</Text>
                            <View className="gap-3">
                                {[
                                    { id: 'price_asc', label: 'Price: Low to High', icon: 'arrow-up' },
                                    { id: 'price_desc', label: 'Price: High to Low', icon: 'arrow-down' },
                                    { id: 'rating', label: 'Top Rated', icon: 'star' }
                                ].map((option) => {
                                    const isActive = filters.sortBy === option.id;
                                    return (
                                        <TouchableOpacity
                                            key={option.id}
                                            onPress={() => setFilters(prev => ({ ...prev, sortBy: option.id as any }))}
                                            className="rounded-xl overflow-hidden"
                                        >
                                            <LinearGradient
                                                colors={isActive ? ['#7F00FF', '#00D4FF'] : ['#1E293B', '#1E293B']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                className="p-[1px] rounded-xl"
                                            >
                                                <View className={`flex-row items-center justify-between p-4 rounded-xl ${isActive ? 'bg-slate-900/90' : 'bg-slate-800'}`}>
                                                    <View className="flex-row items-center gap-3">
                                                        <View className={`w-8 h-8 rounded-full items-center justify-center ${isActive ? 'bg-slate-800' : 'bg-slate-700'}`}>
                                                            <Ionicons
                                                                name={option.icon as any}
                                                                size={16}
                                                                color={isActive ? '#00D4FF' : '#94A3B8'}
                                                            />
                                                        </View>
                                                        <Text className={isActive ? 'text-white font-bold' : 'text-slate-300'}>
                                                            {option.label}
                                                        </Text>
                                                    </View>
                                                    {isActive && (
                                                        <Ionicons name="checkmark-circle" size={20} color="#00D4FF" />
                                                    )}
                                                </View>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Bottom Space */}
                        <View className="h-20" />
                    </ScrollView>

                    {/* Footer - Apply Button */}
                    <View className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 pb-8">
                        <GradientButton onPress={handleApply} title="Show Results" />
                    </View>
                </View>
            </View>
        </Modal>
    );
}
