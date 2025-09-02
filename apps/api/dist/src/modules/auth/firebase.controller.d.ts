import { FirebaseAdminService } from './firebase-admin.service';
export declare class FirebaseController {
    private readonly firebaseAdmin;
    constructor(firebaseAdmin: FirebaseAdminService);
    verify(body: {
        idToken?: string;
    }): Promise<{
        provider: string;
        uid: any;
        phoneNumber: any;
        email: any;
    }>;
}
