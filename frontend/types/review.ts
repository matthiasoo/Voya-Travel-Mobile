export interface Review {
    id: string;
    offerId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number;
    comment: string;
    createdAt: number;
}
