import firestore from "@react-native-firebase/firestore";
import { Report, ReportReason } from "../types/report";

export const ReportService = {
    createReport: async (
        targetId: string,
        targetType: 'OFFER' | 'USER' | 'REVIEW',
        reporterId: string,
        reason: ReportReason,
        description: string,
        targetName?: string
    ) => {
        try {
            const reportRef = firestore().collection('reports').doc();
            const report: Report = {
                id: reportRef.id,
                targetId,
                targetType,
                targetName,
                reporterId,
                reason,
                description,
                status: 'PENDING',
                createdAt: Date.now()
            };

            await reportRef.set(report);

            
            if (targetType === 'USER') {
                const reportsSnapshot = await firestore()
                    .collection('reports')
                    .where('targetId', '==', targetId)
                    .get();

                const uniqueReporters = new Set(reportsSnapshot.docs.map(d => d.data().reporterId)).size;

                if (uniqueReporters >= 5) {
                    await firestore().collection('users').doc(targetId).update({
                        status: 'BLOCKED'
                    });
                    console.log(`User ${targetId} has been auto-blocked due to high report count.`);
                }
            }

            return report.id;
        } catch (error) {
            console.error("Error creating report:", error);
            throw error;
        }
    },

    getReports: async (status?: 'PENDING' | 'RESOLVED' | 'DISMISSED') => {
        try {
            let query = firestore().collection('reports').orderBy('createdAt', 'desc');

            if (status) {
                query = query.where('status', '==', status);
            }

            const snapshot = await query.get();
            return snapshot.docs.map(doc => doc.data() as Report);
        } catch (error) {
            console.error("Error fetching reports:", error);
            throw error;
        }
    },

    updateReportStatus: async (reportId: string, status: 'RESOLVED' | 'DISMISSED', adminAction?: string) => {
        try {
            await firestore().collection('reports').doc(reportId).update({
                status,
                resolvedAt: Date.now(),
                adminAction
            });
        } catch (error) {
            console.error("Error updating report status:", error);
            throw error;
        }
    }
};
