import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  Min, 
  Max, 
  Length, 
  IsArray, 
  ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';

class BulkServiceItem {
  @IsString()
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

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class BulkCreateServicesDto {
  @IsString()
  businessId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkServiceItem)
  services: BulkServiceItem[];

  @IsOptional()
  @IsString()
  source?: 'onboarding' | 'import' | 'manual';

  @IsOptional()
  @IsString()
  batchId?: string;
}

export class UpdateBatchServicesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkServiceItem)
  services: BulkServiceItem[];

  @IsOptional()
  @IsString()
  removeUnspecified?: boolean;
}

export class ServiceTemplateItem {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0.01)
  @Max(9999.99)
  defaultPrice: number;

  @IsNumber()
  @Min(15)
  @Max(480)
  defaultDuration: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class BusinessTypeTemplatesList {
  @IsString()
  businessType: string;

  @IsArray()
  templates: ServiceTemplateItem[];
}

export class TemplatesByBusinessType {
  @IsString()
  businessType: string;

  @IsArray()
  templates: ServiceTemplateItem[];
}

export const SALON_TEMPLATES: ServiceTemplateItem[] = [
  {
    name: 'Haircut',
    defaultPrice: 25.0,
    defaultDuration: 45,
    description: 'Professional haircut with styling consultation',
    category: 'Hair Styling'
  },
  {
    name: 'Hair Wash & Styling',
    defaultPrice: 20.0,
    defaultDuration: 30,
    description: 'Hair washing and professional styling',
    category: 'Hair Styling'
  },
  {
    name: 'Facial',
    defaultPrice: 50.0,
    defaultDuration: 60,
    description: 'Deep cleansing facial treatment',
    category: 'Skin Care'
  },
  {
    name: 'Hair Color',
    defaultPrice: 100.0,
    defaultDuration: 120,
    description: 'Professional hair coloring service',
    category: 'Hair Coloring'
  },
  {
    name: 'Manicure',
    defaultPrice: 25.0,
    defaultDuration: 45,
    description: 'Nail cleaning, shaping, and polishing',
    category: 'Nail Care'
  },
  {
    name: 'Pedicure',
    defaultPrice: 30.0,
    defaultDuration: 45,
    description: 'Foot bath, nail care, and exfoliation',
    category: 'Nail Care'
  }
];

export const SPA_TEMPLATES: ServiceTemplateItem[] = [
  {
    name: 'Relaxation Massage',
    defaultPrice: 80.0,
    defaultDuration: 60,
    description: 'Full body relaxation massage with aromatherapy',
    category: 'Massage Therapy'
  },
  {
    name: 'Deep Tissue Massage',
    defaultPrice: 120.0,
    defaultDuration: 90,
    description: 'Targeted massage for muscle tension relief',
    category: 'Massage Therapy'
  },
  {
    name: 'Facial Treatment',
    defaultPrice: 75.0,
    defaultDuration: 75,
    description: 'Customized facial treatment for skin rejuvenation',
    category: 'Skin Care'
  },
  {
    name: 'Body Scrub',
    defaultPrice: 60.0,
    defaultDuration: 45,
    description: 'Full body exfoliation and moisturization',
    category: 'Body Treatments'
  }
];

export const BARBER_SHOP_TEMPLATES: ServiceTemplateItem[] = [
  {
    name: 'Men\'s Haircut',
    defaultPrice: 20.0,
    defaultDuration: 30,
    description: 'Men\'s professional haircut with styling',
    category: 'Hair Services'
  },
  {
    name: 'Beard Trim',
    defaultPrice: 15.0,
    defaultDuration: 15,
    description: 'Beard shaping and grooming',
    category: 'Beard Services'
  },
  {
    name: 'Hot Towel Shave',
    defaultPrice: 35.0,
    defaultDuration: 30,
    description: 'Traditional hot towel shave service',
    category: 'Shaving Services'
  }
];

export const CLINIC_TEMPLATES: ServiceTemplateItem[] = [
  {
    name: 'Consultation',
    defaultPrice: 50.0,
    defaultDuration: 30,
    description: 'Professional skin consultation and analysis',
    category: 'Consultation'
  },
  {
    name: 'Chemical Peel',
    defaultPrice: 150.0,
    defaultDuration: 90,
    description: 'Advanced chemical peel treatment',
    category: 'Skin Treatments'
  },
  {
    name: 'Microdermabrasion',
    defaultPrice: 100.0,
    defaultDuration: 60,
    description: 'Professional microdermabrasion treatment',
    category: 'Skin Treatments'
  }
];

export const getServiceTemplatesByBusinessType = (businessType: string): ServiceTemplateItem[] => {
  switch (businessType.toUpperCase()) {
    case 'SPA':
      return SPA_TEMPLATES;
    case 'BARBER_SHOP':
      return BARBER_SHOP_TEMPLATES;
    case 'CLINIC':
      return CLINIC_TEMPLATES;
    case 'SALON':
    default:
      return SALON_TEMPLATES;
  }
};