import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsObject, 
  IsArray, 
  ValidateNested, 
  IsNumber,
  IsUrl,
  IsBoolean,
  Length, 
  Matches, 
  IsNotEmpty,
  Min,
  Max,
  IsEmail
} from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessType } from 'shared-types';

class Address {
  @IsString()
  @IsNotEmpty()
  @Length(10, 200, { message: 'Address must be between 10 and 200 characters' })
  street: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50, { message: 'City must be between 2 and 50 characters' })
  city: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50, { message: 'State must be between 2 and 50 characters' })
  state: string;

  @IsString()
  @IsNotEmpty()
  @Length(5, 10, { message: 'ZIP code must be between 5 and 10 characters' })
  @Matches(/^\d{5,10}$/, { message: 'ZIP code must be numeric' })
  zip: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 50, { message: 'Country must be between 2 and 50 characters' })
  country: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}

class ServiceDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 50, { message: 'Service name must be between 3 and 50 characters' })
  name: string;

  @IsNumber()
  @Min(0.01)
  @Max(9999.99)
  price: number;

  @IsNumber()
  @Min(15)
  @Max(480)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  @Length(0, 200, { message: 'Description must be under 200 characters' })
  description?: string;

  @IsOptional()
  @IsString()
  @Length(3, 30, { message: 'Category must be between 3 and 30 characters' })
  category?: string;
}

class ContactInfo {
  @IsString()
  @Matches(/^[+]([1-9]\\d{1,3})\\s?\\d{6,14}$/, { 
    message: 'Primary phone must be in international format' 
  })
  primaryPhone: string;

  @IsOptional()
  @IsString()
  @Matches(/^[+]([1-9]\\d{1,3})\\s?\\d{6,14}$/, { 
    message: 'WhatsApp number must be in international format' 
  })
  whatsApp?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200, { message: 'Notes must be under 200 characters' })
  notes?: string;
}

class SocialLinks {
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Website must be a valid URL' })
  website?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Facebook must be a valid URL' })
  facebook?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Instagram must be a valid URL' })
  instagram?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'LinkedIn must be a valid URL' })
  linkedIn?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] }, { message: 'Twitter must be a valid URL' })
  twitter?: string;
}

class OnboardingStepData {
  @IsEnum(['step1_business_identity', 'step2_contact_location', 'step3_services', 'step4_hours', 'step5_review'])
  currentStep: string;

  @IsBoolean()
  step1_business_identity: boolean;

  @IsBoolean()
  step2_contact_location: boolean;

  @IsBoolean()
  step3_services: boolean;

  @IsBoolean()
  step4_hours: boolean;

  @IsBoolean()
  step5_review: boolean;

  @IsOptional()
  @IsString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  startedAt: string;
}

export class CreateOnboardingBusinessDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100, { message: 'Business name must be between 2 and 100 characters' })
  name: string;

  @IsString()
  @IsOptional()
  @Length(0, 200, { message: 'Tagline must be under 200 characters' })
  tagline?: string;

  @IsEnum(BusinessType, { message: 'Invalid business type' })
  businessType: BusinessType;

  @ValidateNested()
  @Type(() => Address)
  @IsObject()
  address: Address;

  @ValidateNested()
  @Type(() => ContactInfo)
  contactInfo: ContactInfo;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinks)
  socialLinks?: SocialLinks;

  @IsString()
  @IsOptional()
  @Length(0, 1000, { message: 'Description must be under 1000 characters' })
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services: ServiceDto[];

  @IsObject()
  hoursOfOperation?: Record<string, { 
    open: string; 
    close: string; 
    closed: boolean 
  }>;

  @IsString()
  @IsOptional()
  @Length(2, 50, { message: 'Business category must be between 2 and 50 characters' })
  category?: string;

  @IsString()
  @IsOptional()
  @Length(2, 30, { message: 'Subcategory must be between 2 and 30 characters' })
  subcategory?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => OnboardingStepData)
  onboardingProgress: OnboardingStepData;

  @IsString()
  @IsOptional()
  @Length(3, 50, { message: 'Logo URL must be accessible' })
  logoUrl?: string;

  @IsString()
  @IsOptional()
  @Length(3, 50, { message: 'Cover image URL must be accessible' })
  coverImageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Length(1, 3, { each: true, message: 'Keywords must be 1-3 characters' })
  businessKeywords?: string[];

  @IsString()
  @IsOptional()
  @Length(2, 20, { message: 'Currency must be 2-3 characters' })
  currency?: string;

  @IsString()
  @IsOptional()
  @Length(2, 50, { message: 'Language preference must be 2-50 characters' })
  language?: string;

  @IsOptional()
  @IsBoolean()
  isAutoGenerated?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}