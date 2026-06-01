/**
 * Encryption Service
 *
 * AES-256-GCM encryption/decryption for sensitive channel credentials.
 * Format: base64(iv):base64(ciphertext):base64(authTag)
 */

import crypto from 'crypto';
import { getConfig } from '../config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

class EncryptionService {
  private getKey(): Buffer {
    const config = getConfig();
    if (!config.channelEncryptionKey) {
      throw new Error('CHANNEL_ENCRYPTION_KEY is not configured. Cannot encrypt/decrypt credentials.');
    }
    return Buffer.from(config.channelEncryptionKey, 'hex');
  }

  /**
   * Encrypt plaintext using AES-256-GCM.
   * Returns format: base64(iv):base64(ciphertext):base64(authTag)
   */
  encrypt(plaintext: string): string {
    const key = this.getKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
  }

  /**
   * Decrypt ciphertext in format: base64(iv):base64(ciphertext):base64(authTag)
   */
  decrypt(ciphertext: string): string {
    const key = this.getKey();
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted credential format');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const encrypted = Buffer.from(parts[1], 'base64');
    const authTag = Buffer.from(parts[2], 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}

export const encryptionService = new EncryptionService();
