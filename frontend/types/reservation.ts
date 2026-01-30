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
    
    offerId: string;
    offerTitle: string;
    offerImage: string;
    providerId: string;
    clientId: string;
    unitId: string;       
    unitName: string;     

    
    createdAt: number;
    updatedAt: number;

    
    startDate: number;    
    endDate: number;      
    totalPrice: number;
    guestCount: number;   
    status: ReservationStatus;

    
    contactDetails: UserAddress;

    
    hasReviewed?: boolean;
}
