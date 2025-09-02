import { BookingStatus } from 'shared-types';
export declare class UpdateBookingDto {
    status?: BookingStatus;
    scheduledAt?: string;
    notes?: string;
}
