import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsObject, 
  Length, 
  Matches, 
  IsNotEmpty 
} from 'class-validator';
import { BusinessType } from 'shared-types';

export class CreateBusinessDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100, { message: 'Business name must be between 2 and 100 characters' })
  name: string;

  @IsEnum(BusinessType, { message: 'Invalid business type' })
  businessType: BusinessType;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+[1-9]\d{1,14}$/, { 
    message: 'Phone number must be in E.164 format (e.g., +1234567890)' 
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 200, { message: 'Address must be between 10 and 200 characters' })
  address: string;

  @IsOptional()
  @IsObject()
  hoursOfOperation?: Record<string, { open: string; close: string; closed: boolean }>;
}

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Business name must be between 2 and 100 characters' })
  name?: string;

  @IsOptional()
  @IsEnum(BusinessType, { message: 'Invalid business type' })
  businessType?: BusinessType;

  @IsOptional()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, { 
    message: 'Phone number must be in E.164 format (e.g., +1234567890)' 
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @Length(10, 200, { message: 'Address must be between 10 and 200 characters' })
  address?: string;

  @IsOptional()
  @IsObject()
  hoursOfOperation?: Record<string, { open: string; close: string; closed: boolean }>;
}