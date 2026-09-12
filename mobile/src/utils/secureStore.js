import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
const SESSION_KEY = 'i3dion_session_token';
const USER_KEY = 'i3dion_user_data';
export const SecureStorage = {
    async setToken(token) {
        if (Platform.OS === 'web') {
            localStorage.setItem(SESSION_KEY, token);
            return;
        }
        await SecureStore.setItemAsync(SESSION_KEY, token, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
    },
    async getToken() {
        if (Platform.OS === 'web') {
            return localStorage.getItem(SESSION_KEY);
        }
        return await SecureStore.getItemAsync(SESSION_KEY);
    },
    async deleteToken() {
        if (Platform.OS === 'web') {
            localStorage.removeItem(SESSION_KEY);
            return;
        }
        await SecureStore.deleteItemAsync(SESSION_KEY);
    },
    async setUserData(userData) {
        const dataString = JSON.stringify(userData);
        if (Platform.OS === 'web') {
            localStorage.setItem(USER_KEY, dataString);
            return;
        }
        await SecureStore.setItemAsync(USER_KEY, dataString, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
    },
    async getUserData() {
        if (Platform.OS === 'web') {
            const data = localStorage.getItem(USER_KEY);
            return data ? JSON.parse(data) : null;
        }
        const dataString = await SecureStore.getItemAsync(USER_KEY);
        return dataString ? JSON.parse(dataString) : null;
    },
    async deleteUserData() {
        if (Platform.OS === 'web') {
            localStorage.removeItem(USER_KEY);
            return;
        }
        await SecureStore.deleteItemAsync(USER_KEY);
    },
    async clearAll() {
        await this.deleteToken();
        await this.deleteUserData();
    }
};
