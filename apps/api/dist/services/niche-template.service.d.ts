/**
 * Niche Template Service
 *
 * Handles niche template management for different business categories.
 * Templates define terminology, enabled modules, default services, and message templates.
 */
import { NicheTemplate, BusinessCategory } from '@salex/shared-types';
interface CreateTemplateInput {
    code: string;
    displayName: string;
    icon: string;
    terminology: TerminologyConfig;
    enabledModules: string[];
    defaultServices: DefaultService[];
    defaultHours: DefaultHours;
    messageTemplates: MessageTemplates;
}
interface UpdateTemplateInput {
    displayName?: string;
    icon?: string;
    terminology?: TerminologyConfig;
    enabledModules?: string[];
    defaultServices?: DefaultService[];
    defaultHours?: DefaultHours;
    messageTemplates?: MessageTemplates;
}
interface TerminologyConfig {
    resource: string;
    resourcePlural: string;
    staff: string;
    staffPlural: string;
    service: string;
    servicePlural: string;
    appointment: string;
    appointmentPlural: string;
    customer: string;
    customerPlural: string;
}
interface DefaultService {
    name: string;
    description?: string;
    price: number;
    durationMinutes: number;
}
interface DefaultHours {
    open: string;
    close: string;
    daysOfWeek: number[];
}
interface MessageTemplates {
    welcome: string;
    serviceList: string;
    bookingConfirmation: string;
    bookingReminder: string;
    businessClosed: string;
}
declare class NicheTemplateService {
    /**
     * Get template by code
     */
    getTemplate(code: string): Promise<NicheTemplate>;
    /**
     * Get all active templates
     */
    getAllTemplates(): Promise<NicheTemplate[]>;
    /**
     * Create new template
     */
    createTemplate(input: CreateTemplateInput): Promise<NicheTemplate>;
    /**
     * Update existing template
     */
    updateTemplate(code: string, input: UpdateTemplateInput): Promise<NicheTemplate>;
    /**
     * Delete template (soft delete by setting isActive = false)
     */
    deleteTemplate(code: string): Promise<void>;
    /**
     * Apply template to business during onboarding
     */
    applyTemplate(businessId: string, templateCode: string): Promise<void>;
    /**
     * Get terminology for a business category
     */
    getTerminology(category: BusinessCategory): Promise<TerminologyConfig>;
    /**
     * Get message templates for a business category
     */
    getMessageTemplates(category: BusinessCategory): Promise<MessageTemplates>;
    /**
     * Get default services for a template
     */
    getDefaultServices(templateCode: string): Promise<DefaultService[]>;
    /**
     * Get default hours for a template
     */
    getDefaultHours(templateCode: string): Promise<DefaultHours>;
    /**
     * Validate that all module codes exist
     */
    private validateModules;
    /**
     * Get template usage statistics
     */
    getTemplateStats(): Promise<{
        code: string;
        displayName: string;
        businessCount: number;
    }[]>;
}
export declare const nicheTemplateService: NicheTemplateService;
export {};
//# sourceMappingURL=niche-template.service.d.ts.map