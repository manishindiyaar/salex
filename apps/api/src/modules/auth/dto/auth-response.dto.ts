import { User, Business } from 'shared-types';

/**
 * Firebase-only Auth user response DTO.
 * Removed Clerk-specific fields; includes minimal fields needed by clients.
 */
export class AuthUserResponseDto {
  id: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
  businesses?: Business[];

  constructor(user: User & { businesses?: Business[] }) {
    this.id = user.id;
    this.phoneNumber = user.phoneNumber;
    this.createdAt = user.createdAt as any;
    this.updatedAt = user.updatedAt as any;
    this.businesses = user.businesses;
  }
}

export class BusinessMeResponseDto {
  business: Business | null;
  user: AuthUserResponseDto;

  constructor(user: User & { businesses?: Business[] }) {
    this.user = new AuthUserResponseDto(user);
    this.business = user.businesses && user.businesses.length > 0 ? user.businesses[0] : null;
  }
}
