import { ConfigService } from '@nestjs/config';
export declare class FirebaseAdminService {
    private readonly config;
    private app;
    constructor(config: ConfigService);
    verifyIdToken(idToken: string): Promise<import("firebase-admin/lib/auth/token-verifier").DecodedIdToken>;
}
