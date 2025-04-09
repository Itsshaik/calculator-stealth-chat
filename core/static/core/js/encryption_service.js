/**
 * Client-side Encryption Service
 * 
 * This module handles message encryption and decryption on the client side using
 * the private key stored in localStorage. This allows for WhatsApp-like end-to-end
 * encryption where private keys never leave the client device.
 */

class EncryptionService {
    constructor(keyManager) {
        this.keyManager = keyManager;
        this.userId = null;
    }

    /**
     * Initialize the encryption service with the current user's ID
     * 
     * @param {string} userId - The current user's ID
     */
    init(userId) {
        this.userId = userId;
        console.log(`Encryption service initialized for user ${userId}`);
    }

    /**
     * Decrypt a message using the private key from localStorage
     * 
     * @param {string} encryptedMessage - The encrypted message
     * @returns {Promise<string>} - The decrypted message or error message
     */
    async decryptMessage(encryptedMessage) {
        if (!this.userId) {
            return Promise.reject('Encryption service not initialized with user ID');
        }

        // Get the private key from localStorage
        const privateKey = this.keyManager.getPrivateKey(this.userId);
        if (!privateKey) {
            return Promise.reject('Private key not found in local storage');
        }

        try {
            // Send to the server for decryption (server-side function using our private key)
            const response = await fetch('/api/decrypt_message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({
                    encrypted_message: encryptedMessage,
                    private_key: privateKey
                })
            });

            const data = await response.json();
            if (data.status === 'success') {
                return data.decrypted_message;
            } else {
                console.error('Server decryption failed:', data.message);
                return `🔒 Decryption failed: ${data.message}`;
            }
        } catch (error) {
            console.error('Decryption error:', error);
            return '🔒 Could not decrypt message';
        }
    }

    /**
     * Get CSRF token from the cookie
     * 
     * @returns {string} - The CSRF token
     */
    getCsrfToken() {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1];
        return cookieValue || '';
    }
}

// Create a global instance
const encryptionService = new EncryptionService(keyManager);