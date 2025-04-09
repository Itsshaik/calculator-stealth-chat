/**
 * Key Management System
 * 
 * This module manages client-side encryption keys for WhatsApp-like end-to-end encryption.
 * Private keys are stored exclusively in the browser's localStorage and never sent to the server.
 */

class KeyManager {
    constructor() {
        this.storageKeyPrefix = 'e2e_';
        this.privateKeyStorageKey = `${this.storageKeyPrefix}private_key`;
    }

    /**
     * Store the private key in localStorage.
     * 
     * @param {string} privateKey - The PEM formatted private key
     * @param {string} userId - The user ID to associate with this key
     * @returns {boolean} - Success status
     */
    storePrivateKey(privateKey, userId) {
        try {
            // Store with user ID to prevent key mix-ups if multiple users share a device
            const keyData = {
                key: privateKey,
                userId: userId,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem(this.privateKeyStorageKey, JSON.stringify(keyData));
            console.log('Private key stored securely in local storage');
            return true;
        } catch (error) {
            console.error('Failed to store private key:', error);
            return false;
        }
    }

    /**
     * Retrieve the private key from localStorage.
     * 
     * @param {string} userId - The user ID to validate the key belongs to the correct user
     * @returns {string|null} - The private key or null if not found
     */
    getPrivateKey(userId) {
        try {
            const keyData = localStorage.getItem(this.privateKeyStorageKey);
            if (!keyData) {
                console.error('No private key found in local storage');
                return null;
            }
            
            const parsedKeyData = JSON.parse(keyData);
            
            // Verify the key belongs to this user
            if (parsedKeyData.userId !== userId) {
                console.error('Private key belongs to a different user');
                return null;
            }
            
            return parsedKeyData.key;
        } catch (error) {
            console.error('Failed to retrieve private key:', error);
            return null;
        }
    }

    /**
     * Remove the private key from localStorage.
     * 
     * @returns {boolean} - Success status
     */
    clearPrivateKey() {
        try {
            localStorage.removeItem(this.privateKeyStorageKey);
            return true;
        } catch (error) {
            console.error('Failed to clear private key:', error);
            return false;
        }
    }

    /**
     * Check if the private key exists in localStorage.
     * 
     * @param {string} userId - The user ID to validate
     * @returns {boolean} - True if the key exists for this user
     */
    hasPrivateKey(userId) {
        const key = this.getPrivateKey(userId);
        return key !== null;
    }

    /**
     * When a user is first registering, save their temporary private key from session
     * 
     * @param {string} userId - The user ID
     * @param {string} tempPrivateKey - The temporary private key from session
     * @returns {boolean} - Success status
     */
    importTemporaryPrivateKey(userId, tempPrivateKey) {
        if (!tempPrivateKey) {
            console.error('No temporary private key provided');
            return false;
        }
        
        return this.storePrivateKey(tempPrivateKey, userId);
    }
}

// Create a global instance
const keyManager = new KeyManager();