import { User, Business } from 'shared-types';
export declare class AuthUserResponseDto {
    id: string;
    phoneNumber: string;
    createdAt: Date;
    updatedAt: Date;
    businesses?: Business[];
    constructor(user: User & {
        businesses?: Business[];
    });
}
export declare class BusinessMeResponseDto {
    business: Business | null;
    user: AuthUserResponseDto;
    constructor(user: User & {
        businesses?: Business[];
    });
}
