import { PrismaService } from '../../core/prisma.service';
import { User, Business } from 'shared-types';
type CreateUserDto = {
    firebaseUid: string;
    phoneNumber: string;
};
export declare class UserService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findByFirebaseUid(firebaseUid: string): Promise<User & {
        businesses?: Business[];
    } | null>;
    findById(id: string): Promise<User & {
        businesses?: Business[];
    } | null>;
    createUser(userData: CreateUserDto): Promise<User>;
    syncUserByFirebaseUid(firebaseUid: string, phoneNumber?: string): Promise<User & {
        businesses?: Business[];
    }>;
    updateUser(id: string, updateData: Partial<Pick<User, 'phoneNumber'>>): Promise<User>;
    getUserBusinesses(userId: string): Promise<Business[]>;
    getUserPrimaryBusiness(userId: string): Promise<Business | null>;
    findBusinessByPhoneNumber(phoneNumber: string): Promise<Business & {
        owner: User;
    } | null>;
}
export {};
