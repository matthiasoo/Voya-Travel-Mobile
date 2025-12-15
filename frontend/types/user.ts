export type UserRole = 'TOURIST' | 'PROVIDER' | 'ADMIN';

export interface BaseUser {
    uid: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    createdAt: number;
}

export interface TouristUser extends BaseUser {
    role: 'TOURIST';
    avatarUrl?: string;
}

export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';

export type ProviderCategory = 'ACCOMODATION' | 'TOURS' | 'ATTRACIONS' | 'GUIDE';

export interface ProviderUser extends BaseUser {
    role: 'PROVIDER';

    verificationStatus: VerificationStatus;
    companyName: string;
    phoneNumber: string;

    address?: {
        street: string;
        city: string;
        zipCode: string;
        country: string;
    };

    category: ProviderCategory;
    bio?: string;

    rating: number;
    reviewsCount: number;
}

export interface AdminUser extends BaseUser {
    role: 'ADMIN';
}

export type AppUser = TouristUser | ProviderUser | AdminUser;