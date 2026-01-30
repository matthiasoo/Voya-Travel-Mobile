export type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'VIOLENCE' | 'OTHER';

export interface Report {
    id: string;
    targetId: string; 
    targetType: 'OFFER' | 'USER' | 'REVIEW';
    targetName?: string; 
    reporterId: string;
    reason: ReportReason;
    description: string;
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
    createdAt: number;
    resolvedAt?: number;
    adminAction?: string;
}
