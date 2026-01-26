export type ReservationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface UserAddress {
    street: string;
    city: string;
    zipCode: string;
    country: string;
    phone: string;
    fullName: string;
}

export interface Reservation {
    id: string;
    // Relationships
    offerId: string;
    offerTitle: string;
    offerImage: string;
    providerId: string;
    clientId: string;
    unitId: string;       // Which specific unit type was booked
    unitName: string;     // e.g. "Double Room with View"

    // Timestamps
    createdAt: number;
    updatedAt: number;

    // Booking Details
    startDate: number;    // Timestamp
    endDate: number;      // Timestamp
    totalPrice: number;
    guestCount: number;   // Added guest count for context
    status: ReservationStatus;

    // Contact Info
    contactDetails: UserAddress;

    // Status
    hasReviewed?: boolean;
}
