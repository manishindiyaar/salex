import { IsISO8601, IsOptional, IsString, IsEnum } from 'class-validator';
import { BookingStatus } from 'shared-types';

export class UpdateBookingDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}