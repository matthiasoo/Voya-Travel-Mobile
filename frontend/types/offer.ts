export type ProviderCategory = 'ACCOMMODATION' | 'TOURS' | 'ATTRACTIONS' | 'GUIDE';
export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';

export interface BaseOffer {
    id: string;
    verificationStatus: VerificationStatus;
    providerId: string;
    createdAt: number;
    updatedAt: number;
    isActive: boolean;

    title: string;
    description: string;

    price: number;

    images: string[];
    location: {
        latitude: number;
        longitude: number;
        street: string;
        zipCode: string;
        city: string;
        country: string;
    };

    rating: number;
    reviewsCount: number;
}

export interface AccommodationUnit {
    id: string;
    name: string;
    type: 'ROOM' | 'ENTIRE_APARTMENT' | 'BED_IN_DORM';

    pricePerNight: number;
    capacity: {
        adults: number;
        children: number;
    };

    bedConfig: string;
    sqMeters?: number;
    amenities: string[];
    images: string[];

    quantity: number;
}

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

export type Offer = AccommodationOffer;