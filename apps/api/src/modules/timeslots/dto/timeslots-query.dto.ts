import { 
  IsString, 
  IsOptional, 
  IsNumberString,
  Matches,
  IsUUID,
  Min,
  Max
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { TimeSlotsQuery } from 'shared-types';

export class TimeSlotsQueryDto implements TimeSlotsQuery {
  @IsString()
  @IsUUID('4', { message: 'Business ID must be a valid UUID' })
  businessId: string;

  @IsOptional()
  @IsString()
  @IsUUID('4', { message: 'Service ID must be a valid UUID' })
  serviceId?: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { 
    message: 'Start date must be in YYYY-MM-DD format' 
  })
  startDate: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { 
    message: 'End date must be in YYYY-MM-DD format' 
  })
  endDate: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Type(() => Number)
  @Min(15, { message: 'Slot interval must be at least 15 minutes' })
  @Max(120, { message: 'Slot interval must be at most 120 minutes' })
  slotInterval?: number;
}