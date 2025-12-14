import storage from '@react-native-firebase/storage';

/**
 * Uploads a user's avatar to Firebase Storage.
 * @param userId The user's unique ID.
 * @param uri The local file URI of the image to upload.
 * @returns The download URL of the uploaded image.
 */
export const uploadUserAvatar = async (userId: string, uri: string): Promise<string> => {
    try {
        // Create a reference to the file location
        const reference = storage().ref(`users/${userId}/avatar.jpg`);

        // Upload the file
        await reference.putFile(uri);

        // Get the download URL
        const url = await reference.getDownloadURL();
        return url;
    } catch (error) {
        console.error("Error uploading avatar: ", error);
        throw error;
    }
};
