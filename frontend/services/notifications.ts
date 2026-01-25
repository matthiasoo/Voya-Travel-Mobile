import * as Notifications from 'expo-notifications';
import firestore from '@react-native-firebase/firestore';
import { Reservation } from '../types/reservation';
import { Offer } from '../types/offer';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const NotificationService = {
    requestPermissions: async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        return status === 'granted';
    },

    scheduleLocalNotification: async (title: string, body: string, data = {}) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: 'default'
            },
            trigger: null, // Send immediately
        });
    },

    listenForBookingUpdates: (userId: string, role: string) => {
        const field = role === 'PROVIDER' ? 'providerId' : 'clientId';

        return firestore()
            .collection('bookings')
            .where(field, '==', userId)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'modified') {
                        const booking = change.doc.data() as Reservation;
                        // const previous = loadPreviousBookingState(change.doc.id); 
                        // Simplified: Check specific status changes if possible or just notify on relevant status changes.

                        // Actually, for a simple demo, we can just check the current status and maybe trigger if it's "recently" updated?
                        // Better approach for MVP without storing previous state:
                        // Just look at the status. 

                        if (role === 'TOURIST') {
                            if (booking.status === 'ACCEPTED') {
                                NotificationService.scheduleLocalNotification(
                                    "Booking Confirmed!",
                                    `Your booking for ${booking.offerTitle} has been accepted.`
                                );
                            } else if (booking.status === 'REJECTED') {
                                NotificationService.scheduleLocalNotification(
                                    "Booking Rejected",
                                    `Your booking for ${booking.offerTitle} was rejected.`
                                );
                            }
                        } else if (role === 'PROVIDER') {
                            if (booking.status === 'PENDING') {
                                // This usually fires on 'added', not 'modified', but checking 'added' type below.
                            }
                        }
                    } else if (change.type === 'added') {
                        const booking = change.doc.data() as Reservation;
                        // Avoid notifying for existing bookings on initial load?
                        // Check booking.createdAt vs NOW - a small threshold?
                        // Or relying on snapshot metadata if from cache?
                        const isNew = Date.now() - booking.createdAt < 10000; // Created in last 10 secs

                        if (role === 'PROVIDER' && booking.status === 'PENDING' && isNew) {
                            NotificationService.scheduleLocalNotification(
                                "New Booking Request",
                                `New request for ${booking.offerTitle} (${booking.unitName})`
                            );
                        }
                    }
                });
            }, error => console.error("Notification listener error:", error));
    },

    listenForChatUpdates: (userId: string) => {
        // Listen to all chats where user is a participant
        return firestore()
            .collection('chats')
            .where('participants', 'array-contains', userId)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'modified') {
                        const chatData = change.doc.data();
                        const lastMessage = chatData.lastMessage;

                        // Check if lastMessage exists and was sent by someone else
                        if (lastMessage && lastMessage.senderId !== userId) {
                            // Check if message is "new" (e.g., within last 10 seconds)
                            // This depends on how often 'modified' events fire or if we have a proper 'unread' count.
                            // For MVP, we'll check timestamp.
                            const isNew = Date.now() - lastMessage.createdAt < 10000;

                            if (isNew) {
                                // Ideally, get sender name from participants or cached map
                                // For MVP, just say "New message"
                                NotificationService.scheduleLocalNotification(
                                    "New Message",
                                    `You have a new message: ${lastMessage.text}`
                                );
                            }
                        }
                    }
                });
            }, error => console.error("Chat listener error:", error));
    },

    registerForPushNotificationsAsync: async () => {
        // For real push notifications with tokens. For this MVP, we use local notifications triggered by Firestore listeners.
        // We just ensure we have permission.
        return NotificationService.requestPermissions();
    }
};

// Helper (in-memory cache for simplicity, though reload wipes it)
// Real apps would use Redux/Context or only notify on transition.
// The modified check above is a bit spammy if multiple updates happen.
// For the demo, ensure we only notify on meaningful status changes.
// snapshot.docChanges() gives us exactly what changed in this snapshot.
