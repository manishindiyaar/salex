import { IsNotEmpty, IsString, IsNumber, IsOptional, Min, Max, Length, IsDecimal } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateServiceRequest } from 'shared-types';

export class CreateServiceDto implements CreateServiceRequest {
  @IsNotEmpty()
  @IsString()
  @Length(1, 50, { message: 'Service name must be between 1 and 50 characters' })
  name: string;

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must have at most 2 decimal places' })
  @Min(0.01, { message: 'Price must be at least $0.01' })
  @Max(99999.99, { message: 'Price must not exceed $99,999.99' })
  @Type(() => Number)
  price: number;

  @IsNotEmpty()
  @IsNumber({}, { message: 'Duration must be a number' })
  @Min(15, { message: 'Duration must be at least 15 minutes' })
  @Max(480, { message: 'Duration must not exceed 480 minutes (8 hours)' })
  @Type(() => Number)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Description must not exceed 500 characters' })
  description?: string;
}