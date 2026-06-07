/**
 * WhatsApp Flow Encryption/Decryption Service
 *
 * Implements Meta's WhatsApp Flows data exchange encryption protocol (v3.0).
 * Uses RSA-OAEP-SHA256 for AES key decryption, AES-128-GCM for payload.
 *
 * Reference: https://developers.facebook.com/docs/whatsapp/flows/guides/implementingyourflowendpoint
 */

import crypto from 'crypto';
import { getConfig } from '../config';

export interface DecryptedFlowRequest {
  decryptedBody: {
    version: string;
    action: string;
    screen?: string;
    data?: Record<string, unknown>;
    flow_token: string;
  };
  aesKeyBuffer: Buffer;
  initialVectorBuffer: Buffer;
}

/**
 * Decrypt an incoming WhatsApp Flow data exchange request.
 * Throws if private key is missing or decryption fails.
 */
export function decryptFlowRequest(body: {
  encrypted_aes_key: string;
  encrypted_flow_data: string;
  initial_vector: string;
}): DecryptedFlowRequest {
  const config = getConfig();
  const privatePem = config.whatsappFlowPrivateKey;

  if (!privatePem) {
    throw new Error('WHATSAPP_FLOW_PRIVATE_KEY not configured');
  }

  const { encrypted_aes_key, encrypted_flow_data, initial_vector } = body;

  // Decrypt the AES key using RSA-OAEP-SHA256
  const decryptedAesKey = crypto.privateDecrypt(
    {
      key: crypto.createPrivateKey(privatePem),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encrypted_aes_key, 'base64'),
  );

  // Decrypt the flow data using AES-128-GCM
  const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64');
  const initialVectorBuffer = Buffer.from(initial_vector, 'base64');

  const TAG_LENGTH = 16;
  const encryptedBody = flowDataBuffer.subarray(0, -TAG_LENGTH);
  const authTag = flowDataBuffer.subarray(-TAG_LENGTH);

  const decipher = crypto.createDecipheriv('aes-128-gcm', decryptedAesKey, initialVectorBuffer);
  decipher.setAuthTag(authTag);

  const decryptedJSON = Buffer.concat([
    decipher.update(encryptedBody),
    decipher.final(),
  ]).toString('utf-8');

  return {
    decryptedBody: JSON.parse(decryptedJSON),
    aesKeyBuffer: decryptedAesKey,
    initialVectorBuffer,
  };
}

/**
 * Encrypt a response payload for WhatsApp Flow data exchange.
 * Uses the same AES key from the request with flipped IV.
 */
export function encryptFlowResponse(
  response: Record<string, unknown>,
  aesKeyBuffer: Buffer,
  initialVectorBuffer: Buffer,
): string {
  // Flip the initialization vector (XOR each byte with 0xFF)
  const flippedIv = Buffer.alloc(initialVectorBuffer.length);
  for (let i = 0; i < initialVectorBuffer.length; i++) {
    flippedIv[i] = initialVectorBuffer[i] ^ 0xff;
  }

  // Encrypt using AES-128-GCM with flipped IV
  const cipher = crypto.createCipheriv('aes-128-gcm', aesKeyBuffer, flippedIv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(response), 'utf-8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  return encrypted.toString('base64');
}

/**
 * Generate a flow token for a session.
 * Uses HMAC-SHA256 with the configured secret.
 */
export function generateFlowToken(customerPhone: string): string {
  const config = getConfig();
  const secret = config.whatsappFlowTokenSecret || 'salex-flow-default-secret';
  const payload = `${customerPhone}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  // Return a compact token: first 32 chars of HMAC + encoded phone
  return `${hmac.slice(0, 16)}:${Buffer.from(customerPhone).toString('base64url')}`;
}

/**
 * Extract customerPhone from a flow token.
 */
export function parseFlowToken(flowToken: string): string | null {
  try {
    const parts = flowToken.split(':');
    if (parts.length < 2) return null;
    return Buffer.from(parts[1], 'base64url').toString('utf-8');
  } catch {
    return null;
  }
}
