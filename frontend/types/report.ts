export type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'VIOLENCE' | 'OTHER';

export interface Report {
    id: string;
    targetId: string; // ID of the reported offer, user, or review
    targetType: 'OFFER' | 'USER' | 'REVIEW';
    targetName?: string; // Optional context (e.g., offer title)
    reporterId: string;
    reason: ReportReason;
    description: string;
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
    createdAt: number;
    resolvedAt?: number;
    adminAction?: string;
}
