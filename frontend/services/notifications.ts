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
            trigger: null, 
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
                                
                            }
                        }
                    } else if (change.type === 'added') {
                        const booking = change.doc.data() as Reservation;
                        
                        
                        
                        const isNew = Date.now() - booking.createdAt < 10000; 

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
        
        return firestore()
            .collection('chats')
            .where('participants', 'array-contains', userId)
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'modified') {
                        const chatData = change.doc.data();
                        const lastMessage = chatData.lastMessage;

                        
                        if (lastMessage && lastMessage.senderId !== userId) {
                            
                            
                            
                            const isNew = Date.now() - lastMessage.createdAt < 10000;

                            if (isNew) {
                                
                                
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
        
        
        return NotificationService.requestPermissions();
    }
};






