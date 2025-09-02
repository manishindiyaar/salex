import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
  private app: admin.app.App;

  constructor(private readonly config: ConfigService) {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    let privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      throw new InternalServerErrorException(
        'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY must be set in apps/api/.env',
      );
    }

    // Handle escaped newlines if provided via env file
    privateKey = privateKey.replace(/\\n/g, '\n');

    const credential = admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });

    // Reuse app if already initialized (hot reload/dev)
    try {
      this.app = admin.app();
    } catch {
      this.app = admin.initializeApp({ credential });
    }
  }

  async verifyIdToken(idToken: string) {
    try {
      const decoded = await this.app.auth().verifyIdToken(idToken, true);
      return decoded;
    } catch (err: any) {
      throw new InternalServerErrorException(
        typeof err?.message === 'string' ? err.message : 'Failed to verify Firebase ID token',
      );
    }
  }
}
