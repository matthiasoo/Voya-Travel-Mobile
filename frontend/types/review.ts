export interface Review {
    id: string;
    offerId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    rating: number; 
    content: string;
    createdAt: number;
}
