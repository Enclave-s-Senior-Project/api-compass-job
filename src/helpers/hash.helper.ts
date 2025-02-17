import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export class HashHelper {
    private static salt = 10;
    private static algorithm = 'aes-256-cbc';
    private static key =
        process.env.HASH_KEY?.length >= 32 ? Buffer.from(process.env.HASH_KEY, 'hex') : crypto.randomBytes(32);

    public static getIv() {
        return crypto.randomBytes(16);
    }

    /**
     * Encrypts plain string
     * @param str {string}
     * @returns Promise<string> Returns encrypted
     */
    public static async encrypt(str: string): Promise<string> {
        return await bcrypt.hash(str, this.salt);
    }

    /**
     * Compares encrypted and provided string
     * @param plain {string}
     * @param encrypted {string}
     * @returns Promise<boolean> Returns Boolean if provided string and encrypted string are equal
     */
    public static async compare(plain: string, encrypted: string): Promise<boolean> {
        return await bcrypt.compare(plain, encrypted);
    }

    /**
     * Encode a string using AES-256-CBC encryption
     * @param text {string}
     * @returns {Object} An object containing the encrypted data and the IV used
     * for encryption. The structure of the object is:
     *   - `encryptedData`: The encrypted data as a hex string.
     *   - `iv`: The initialization vector used for encryption, returned as a hex string.
     */
    public static encode(text: string): { encryptedData: string; iv: string } {
        const iv = this.getIv();
        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return { encryptedData: encrypted, iv: iv.toString('hex') };
    }

    /**
     * Decode a string using AES-256-CBC decryption
     * @param encryptedData {string}
     * @param ivHex {string}
     * @returns {string} The decrypted plain text
     */
    public static decode(encryptedData: string, ivHex: string): string {
        const decipher = crypto.createDecipheriv(this.algorithm, this.key, Buffer.from(ivHex, 'hex'));
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
