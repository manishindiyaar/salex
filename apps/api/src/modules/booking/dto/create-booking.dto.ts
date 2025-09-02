import { IsString, IsUUID, IsISO8601, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsISO8601()
  @IsNotEmpty()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  customerName?: string;
}