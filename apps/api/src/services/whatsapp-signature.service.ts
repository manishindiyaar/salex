import crypto from 'crypto';

class WhatsAppSignatureService {
  verify(rawBody: Buffer | undefined, signatureHeader: string | undefined, appSecret: string | undefined): boolean {
    if (!rawBody || !signatureHeader || !appSecret) {
      return false;
    }

    const expected = `sha256=${crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex')}`;

    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(signatureHeader);

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }
}

export const whatsappSignatureService = new WhatsAppSignatureService();
