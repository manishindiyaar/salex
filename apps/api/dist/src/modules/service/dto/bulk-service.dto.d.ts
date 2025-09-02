declare class BulkServiceItem {
    name: string;
    price: number;
    durationMinutes: number;
    description?: string;
    category?: string;
    imageUrl?: string;
}
export declare class BulkCreateServicesDto {
    businessId: string;
    services: BulkServiceItem[];
    source?: 'onboarding' | 'import' | 'manual';
    batchId?: string;
}
export declare class UpdateBatchServicesDto {
    services: BulkServiceItem[];
    removeUnspecified?: boolean;
}
export declare class ServiceTemplateItem {
    name: string;
    defaultPrice: number;
    defaultDuration: number;
    description?: string;
    category?: string;
}
export declare class BusinessTypeTemplatesList {
    businessType: string;
    templates: ServiceTemplateItem[];
}
export declare class TemplatesByBusinessType {
    businessType: string;
    templates: ServiceTemplateItem[];
}
export declare const SALON_TEMPLATES: ServiceTemplateItem[];
export declare const SPA_TEMPLATES: ServiceTemplateItem[];
export declare const BARBER_SHOP_TEMPLATES: ServiceTemplateItem[];
export declare const CLINIC_TEMPLATES: ServiceTemplateItem[];
export declare const getServiceTemplatesByBusinessType: (businessType: string) => ServiceTemplateItem[];
export {};
