export interface Review {
    id: string;
    offerId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number; // 1-5
    content: string;
    createdAt: number;
}
