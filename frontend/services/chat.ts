import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

export interface ChatMessage {
    id?: string;
    text: string;
    senderId: string;
    createdAt: any; 
}

export interface Chat {
    id: string;
    offerId: string;
    offerTitle: string;
    clientId: string;
    clientName: string;
    providerId: string;
    providerName: string;
    createdAt: any;
    updatedAt: any;
    lastMessage: string;
}

export const createChat = async (
    offerId: string,
    offerTitle: string,
    providerId: string,
    providerName: string
): Promise<string> => {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error("User not authenticated");

    
    const existingSnapshot = await firestore()
        .collection("chats")
        .where("offerId", "==", offerId)
        .where("clientId", "==", currentUser.uid)
        .where("providerId", "==", providerId)
        .get();

    if (!existingSnapshot.empty) {
        return existingSnapshot.docs[0].id;
    }

    
    const newChatRef = firestore().collection("chats").doc();
    
    
    
    
    

    const userDoc = await firestore().collection('users').doc(currentUser.uid).get();
    const clientName = userDoc.exists() ? (userDoc.data()?.fullName || "Tourist") : "Tourist";

    await newChatRef.set({
        offerId,
        offerTitle,
        clientId: currentUser.uid,
        clientName,
        providerId,
        providerName,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        lastMessage: "Chat created",
    });

    return newChatRef.id;
};

export const getUserChats = async (): Promise<Chat[]> => {
    const currentUser = auth().currentUser;
    if (!currentUser) return [];

    
    
    
    

    
    
    

    const clientChats = await firestore()
        .collection('chats')
        .where('clientId', '==', currentUser.uid)
        .get();

    const providerChats = await firestore()
        .collection('chats')
        .where('providerId', '==', currentUser.uid)
        .get();

    const chats: Chat[] = [];

    clientChats.forEach(doc => {
        chats.push({ id: doc.id, ...doc.data() } as Chat);
    });

    providerChats.forEach(doc => {
        
        if (!chats.find(c => c.id === doc.id)) {
            chats.push({ id: doc.id, ...doc.data() } as Chat);
        }
    });

    
    return chats.sort((a, b) => {
        const timeA = a.updatedAt?.toMillis() || 0;
        const timeB = b.updatedAt?.toMillis() || 0;
        return timeB - timeA;
    });
};

export const sendMessage = async (chatId: string, text: string) => {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error("User not authenticated");

    const chatRef = firestore().collection('chats').doc(chatId);
    const messagesRef = chatRef.collection('messages');

    await firestore().runTransaction(async (transaction) => {
        
        const newMessageRef = messagesRef.doc();
        transaction.set(newMessageRef, {
            text,
            senderId: currentUser.uid,
            createdAt: firestore.FieldValue.serverTimestamp(),
        });

        
        transaction.update(chatRef, {
            lastMessage: text,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    });
};
