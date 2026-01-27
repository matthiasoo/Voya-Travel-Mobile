export type UserRole = 'TOURIST' | 'PROVIDER' | 'ADMIN';

export interface BaseUser {
    uid: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    createdAt: number;
    avatarUrl?: string;
    status?: 'ACTIVE' | 'BLOCKED';
}

export interface TouristUser extends BaseUser {
    role: 'TOURIST';
}

export type VerificationStatus = 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';

export type ProviderCategory = 'ACCOMMODATION' | 'TOURS';

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