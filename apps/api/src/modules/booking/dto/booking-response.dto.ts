import { BookingStatus } from 'shared-types';

export class BookingResponseDto {
  id: string;
  businessId: string;
  customerId: string;
  serviceId: string;
  status: BookingStatus;
  scheduledAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  
  // Related data
  customer?: {
    id: string;
    phoneNumber: string;
    name?: string;
  };
  
  service?: {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    description?: string;
  };
  
  business?: {
    id: string;
    name: string;
    phoneNumber: string;
    address: string;
  };
}