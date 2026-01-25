export type ProviderCategory = 'ACCOMMODATION' | 'TOURS' | 'ATTRACTIONS' | 'GUIDE';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';

export interface LocationData {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
    geohash: string;
}

export interface BaseOffer {
    id: string;
    verificationStatus: VerificationStatus;
    providerId: string;
    createdAt: number;
    updatedAt: number;
    isActive: boolean;

    title: string;
    description: string;

    price: number; // Cache for "lowest price", initialize as 0
    currency: string;

    images: string[];
    location: LocationData;

    rating: number;
    reviewsCount: number;
}

// Unit (Child)
export interface AccommodationUnit {
    id: string;
    name: string;
    unitDescription: string;
    type: 'ROOM' | 'ENTIRE_APARTMENT' | 'BED_IN_DORM';
    pricePerNight: number;
    capacity: { adults: number; children: number; };
    bedConfig: string;
    sqMeters?: number;
    amenities: string[];
    images: string[];
    quantity: number;
}

// Property (Parent)
export interface AccommodationOffer extends BaseOffer {
    type: 'ACCOMMODATION';
    details: {
        propertyType: 'HOTEL' | 'APARTMENT' | 'HOSTEL';
        generalAmenities: string[];
        checkInTime: string;
        checkOutTime: string;
        units: AccommodationUnit[];
    };
}

// Tour Offer
export interface TourOffer extends BaseOffer {
    type: 'TOURS';
    details: {
        duration: number; // hours
        meetingPoint: string;
        maxParticipants: number;
        startDates: string[]; // Array of ISO date strings or available days
        whatsIncluded?: string[];
    };
}

export type Offer = AccommodationOffer | TourOffer;