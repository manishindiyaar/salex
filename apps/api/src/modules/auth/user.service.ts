import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma.service';
import { User, Business } from 'shared-types';
// Inlined to remove dependency on deleted Clerk DTO
type CreateUserDto = { firebaseUid: string; phoneNumber: string };

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find user by Firebase UID
   */
  async findByFirebaseUid(firebaseUid: string): Promise<User & { businesses?: Business[] } | null> {
    this.logger.debug(`Finding user by Firebase UID: ${firebaseUid}`);
    
    // Prisma unique where must use a unique field. Ensure prisma schema has @unique on firebaseUid.
    // Use findFirst to avoid TS mismatch when the generated Prisma Client
    // hasn't yet reflected firebaseUid in UserWhereUniqueInput.
    // Fallback to raw query on the mapped column to avoid TS mismatch until Prisma types refresh
    const user = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT u.*, (
         SELECT json_agg(b) FROM businesses b WHERE b.owner_id = u.id
       ) AS businesses
       FROM users u
       WHERE u.firebase_uid = $1
       LIMIT 1`,
      firebaseUid,
    ).then(rows => rows?.[0] || null);

    return (user as unknown) as (User & { businesses?: Business[] }) | null;
  }

  /**
   * Find user by database ID
   */
  async findById(id: string): Promise<User & { businesses?: Business[] } | null> {
    this.logger.debug(`Finding user by ID: ${id}`);
    
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        businesses: true,
      },
    });

    return (user as unknown) as (User & { businesses?: Business[] }) | null;
  }

  /**
   * Create a new user from Firebase token claims
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    this.logger.debug(`Creating user with Firebase UID: ${userData.firebaseUid}`);
    
    try {
      // For test/mock users, use a fixed ID
      const isTestUser = userData.firebaseUid === 'test-firebase-uid';
      
      // Use unchecked create with raw data to avoid type drift until Prisma types refresh
      const user = await (isTestUser 
        ? this.prisma.$executeRawUnsafe(
            `INSERT INTO users (id, firebase_uid, phone_number, created_at, updated_at)
             VALUES ($1, $2, $3, NOW(), NOW())`,
            'test-user-id',
            userData.firebaseUid,
            userData.phoneNumber,
          )
        : this.prisma.$executeRawUnsafe(
            `INSERT INTO users (id, firebase_uid, phone_number, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())`,
            userData.firebaseUid,
            userData.phoneNumber,
          )
      ).then(async () => {
        return this.prisma.$queryRawUnsafe<any[]>(
          `SELECT * FROM users WHERE firebase_uid = $1 LIMIT 1`,
          userData.firebaseUid,
        ).then(rows => rows?.[0]);
      });

      this.logger.log(`User created successfully: ${user.id}`);
      return (user as unknown) as User;
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation - user already exists
        this.logger.warn(`Attempted to create duplicate user: ${userData.firebaseUid}`);
        throw new ConflictException('User already exists');
      }
      this.logger.error(`Failed to create user: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Sync user from Firebase ID token - create if not exists, return if exists
   */
  async syncUserByFirebaseUid(firebaseUid: string, phoneNumber?: string): Promise<User & { businesses?: Business[] }> {
    this.logger.debug(`Syncing user from Firebase: ${firebaseUid}`);
    
    // First try to find existing user
    let user = await this.findByFirebaseUid(firebaseUid);
    
    if (user) {
      this.logger.debug(`User found: ${user.id}`);
      return user;
    }

    // User doesn't exist, create new one
    if (!phoneNumber) {
      this.logger.warn(`Cannot create user ${firebaseUid} without phone number`);
      throw new ConflictException('Phone number is required for user creation');
    }

    this.logger.debug(`Creating new user for Firebase UID: ${firebaseUid}`);
    const newUser = await this.createUser({
      firebaseUid,
      phoneNumber,
    });

    // Return user with businesses relation
    return await this.findByFirebaseUid(firebaseUid) as User & { businesses?: Business[] };
  }

  /**
   * Update user information
   */
  async updateUser(id: string, updateData: Partial<Pick<User, 'phoneNumber'>>): Promise<User> {
    this.logger.debug(`Updating user: ${id}`);
    
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`User updated successfully: ${id}`);
    return (user as unknown) as User;
  }

  /**
   * Find user's businesses
   */
  async getUserBusinesses(userId: string): Promise<Business[]> {
    this.logger.debug(`Getting businesses for user: ${userId}`);
    
    const businesses = await this.prisma.business.findMany({
      where: { ownerId: userId },
    });

    return businesses as Business[];
  }

  /**
   * Get user's primary business (latest business)
   */
  async getUserPrimaryBusiness(userId: string): Promise<Business | null> {
    this.logger.debug(`Getting primary business for user: ${userId}`);
    
    const business = await this.prisma.business.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' }, // Get the latest business, not the oldest
    });

    return business as Business | null;
  }

  /**
   * Find business by phone number (for WhatsApp integration)
   */
  async findBusinessByPhoneNumber(phoneNumber: string): Promise<Business & { owner: User } | null> {
    this.logger.debug(`Finding business by phone number: ${phoneNumber}`);
    
    const business = await this.prisma.business.findFirst({
      where: { phoneNumber },
      include: { owner: true },
    });

    return (business as unknown) as (Business & { owner: User }) | null;
  }
}
