export type UserRole = 'TOURIST' | 'PROVIDER' | 'ADMIN';

export interface BaseUser {
    uid: string;
    email: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    createdAt: number;
}

export interface TouristUser extends BaseUser {
    role: 'TOURIST';
}