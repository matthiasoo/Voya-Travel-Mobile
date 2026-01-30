import storage from '@react-native-firebase/storage';


export const uploadUserAvatar = async (userId: string, uri: string): Promise<string> => {
    try {
        
        const reference = storage().ref(`users/${userId}/avatar.jpg`);

        
        await reference.putFile(uri);

        
        const url = await reference.getDownloadURL();
        return url;
    } catch (error) {
        console.error("Error uploading avatar: ", error);
        throw error;
    }
};


export const uploadImage = async (path: string, uri: string): Promise<string> => {
    try {
        const filename = uri.substring(uri.lastIndexOf('/') + 1);
        const reference = storage().ref(`${path}/${Date.now()}_${filename}`);
        await reference.putFile(uri);
        return await reference.getDownloadURL();
    } catch (error) {
        console.error("Error uploading image: ", error);
        throw error;
    }
};
