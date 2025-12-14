// 1. Enumy dla Kategorii (używane też w Userze)
export type ProviderCategory = 'ACCOMMODATION' | 'TOURS' | 'ATTRACTIONS' | 'GUIDE';

// 2. Wspólny mianownik (BaseOffer)
// To są pola, które ma KAŻDA oferta, niezależnie czy to hotel czy wycieczka.
export interface BaseOffer {
    id: string;
    providerId: string; // Kto dodał
    createdAt: number;
    updatedAt: number;
    isActive: boolean;  // Czy oferta jest widoczna

    title: string;
    description: string;
    price: number;
    currency: string;   // np. 'PLN'

    images: string[];   // Tablica URL-i do Storage
    location: {
        latitude: number;
        longitude: number;
        address: string;
        city: string;
    };

    rating: number;     // Średnia ocen
    reviewsCount: number;
}

// ==========================================================
// 3. Szczegółowe Typy Ofert (Rozszerzenia)
// ==========================================================

// 🏨 Noclegi (ACCOMMODATION)
// Potrzebujemy: ilości osób, łóżek, udogodnień hotelowych
export interface AccommodationOffer extends BaseOffer {
    type: 'ACCOMMODATION'; // Dyskryminator
    details: {
        standard: 'HOTEL' | 'APARTMENT' | 'HOSTEL' | 'RESORT'; // Podtyp
        maxGuests: number;
        bedroomCount: number;
        bedCount: number;
        bathrooms: number;
        amenities: string[]; // np. ['wifi', 'ac', 'parking', 'pool']
        checkInTime: string; // np. "14:00"
        checkOutTime: string; // np. "11:00"
        sqMeters?: number;   // Metraż
    };
}

// 🎒 Wycieczki (TOURS)
// Potrzebujemy: czasu trwania, poziomu trudności, co zawiera cena
export interface TourOffer extends BaseOffer {
    type: 'TOURS';
    details: {
        tourType: 'SIGHTSEEING' | 'HIKING' | 'WATER' | 'ADVENTURE';
        durationHours: number; // np. 4.5
        difficulty: 'EASY' | 'MODERATE' | 'HARD' | 'EXTREME';
        maxParticipants: number; // Limit grupy
        included: string[];      // np. ['lunch', 'transport', 'tickets']
        requirements: string[];  // np. ['comfortable shoes', 'id card']
        startPoint: string;      // Miejsce zbiórki (tekstowo)
    };
}

// 🎡 Atrakcje (ATTRACTIONS)
// Potrzebujemy: godzin otwarcia, ograniczeń wiekowych
export interface AttractionOffer extends BaseOffer {
    type: 'ATTRACTIONS';
    details: {
        attractionType: 'MUSEUM' | 'NATURE' | 'ENTERTAINMENT';
        openingHours: {
            open: string; // "09:00"
            close: string; // "18:00"
        };
        isTicketRequired: boolean;
        ageRestriction?: number; // np. 18+ (opcjonalne)
        accessibility: boolean;  // Czy dla niepełnosprawnych
    };
}

// 🧢 Przewodnicy (GUIDE)
// Potrzebujemy: języków, specjalizacji
export interface GuideOffer extends BaseOffer {
    type: 'GUIDE';
    details: {
        specialization: 'HISTORY' | 'NATURE' | 'FOOD' | 'PHOTOGRAPHY';
        languages: string[]; // np. ['pl', 'en', 'de']
        licenseNumber?: string; // Opcjonalny numer licencji
        pricingType: 'PER_HOUR' | 'PER_GROUP' | 'PER_PERSON';
        services: string[]; // np. ['transport', 'translation']
    };
}

// 4. Główny typ - Unia (Discriminated Union)
// Tego typu będziesz używać w propsach komponentów
export type Offer = AccommodationOffer | TourOffer | AttractionOffer | GuideOffer;