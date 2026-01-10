import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";

export interface ChatMessage {
    id?: string;
    text: string;
    senderId: string;
    createdAt: any; // Firestore Timestamp
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

    // Check if chat already exists
    const existingSnapshot = await firestore()
        .collection("chats")
        .where("offerId", "==", offerId)
        .where("clientId", "==", currentUser.uid)
        .where("providerId", "==", providerId)
        .get();

    if (!existingSnapshot.empty) {
        return existingSnapshot.docs[0].id;
    }

    // Create new chat
    const newChatRef = firestore().collection("chats").doc();
    // We assume the current user is the "Client" if they are initiating the chat from an offer
    // and they are not the provider.
    // We need the client's name. For now, we might fetching it or pass it. 
    // Let's look up the user's profile to get the name, or pass it as an argument.
    // For simplicity/speed as per request, let's fetch it here once.

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

    // Firestore OR queries for multiple fields are tricky (requires multiple queries or specific index).
    // A simpler way often used is querying twice and merging, or ensuring a specific structure.
    // OR queries are supported in newer SDKs with 'Filter.or', but let's stick to safe 'where' queries.
    // Try logic: clientId == uid OR providerId == uid

    // Note: Compound queries with default indices work for simple equality.
    // But we need OR. 
    // Simplest approach: Query for clientId == me, Query for providerId == me, then merge.

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
        // Avoid duplicates if for some reason self-chat exists (unlikely but safe to check id)
        if (!chats.find(c => c.id === doc.id)) {
            chats.push({ id: doc.id, ...doc.data() } as Chat);
        }
    });

    // Sort locally by updatedAt desc
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
        // Add message
        const newMessageRef = messagesRef.doc();
        transaction.set(newMessageRef, {
            text,
            senderId: currentUser.uid,
            createdAt: firestore.FieldValue.serverTimestamp(),
        });

        // Update parent chat
        transaction.update(chatRef, {
            lastMessage: text,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    });
};
