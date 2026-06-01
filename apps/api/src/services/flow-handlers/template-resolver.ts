/**
 * TemplateResolver — resolves service terminology and substitutes placeholders
 * in node message templates based on the business category.
 *
 * Mirrors the legacy `getServiceTerm` / `getServicePluralTerm` behavior from
 * `conversation.service.ts` and adds placeholder substitution for dynamic
 * message templates used by the Flow_Engine.
 *
 * Terminology mapping (Req 9.3):
 *   - CLINIC → "appointment" / "appointments"
 *   - SALON, BEAUTY_PARLOR, SPA → "service" / "services"
 *   - All others (FITNESS, OTHER, undefined) → "service" / "services"
 *
 * Supported placeholders (legacy):
 *   - {{businessName}} — the resolved business name
 *   - {{serviceTerm}} — singular service term for the category
 *   - {{servicePluralTerm}} — plural service term for the category
 *
 * Supported placeholders (dot-path, new):
 *   - {{business.name}} — same as {{businessName}}
 *   - {{business.category}} — the business category
 *   - {{business.routingCode}} — the business routing code
 *   - {{selectedService.name}} — selected service name
 *   - {{selectedService.price}} — selected service price
 *   - {{selectedService.duration}} — selected service duration
 *   - {{selectedTime}} — selected time slot
 *   - {{selectedStaff.name}} — selected staff member name
 *   - {{booking.id}} — booking identifier
 *
 * Unresolvable variables are replaced with empty string (no raw {{...}} in output).
 */

/** Business categories that use clinic terminology. */
const CLINIC_CATEGORIES = new Set(['CLINIC']);

/**
 * Resolve the singular service term for a given business category.
 * Mirrors legacy `ConversationService.getServiceTerm`.
 */
export function getServiceTerm(category?: string | null): string {
  if (category && CLINIC_CATEGORIES.has(category)) {
    return 'appointment';
  }
  return 'service';
}

/**
 * Resolve the plural service term for a given business category.
 * Mirrors legacy `ConversationService.getServicePluralTerm`.
 */
export function getServicePluralTerm(category?: string | null): string {
  if (category && CLINIC_CATEGORIES.has(category)) {
    return 'appointments';
  }
  return 'services';
}

/**
 * Parameters for template resolution.
 */
export interface TemplateResolverParams {
  /** The business category (e.g. 'CLINIC', 'SALON', 'OTHER'). */
  category?: string | null;
  /** The business display name. */
  businessName?: string | null;
  /** The business routing code. */
  routingCode?: string | null;
  /** The selected service name from context. */
  selectedServiceName?: string | null;
  /** The selected service price from context. */
  selectedServicePrice?: number | null;
  /** The selected service duration (in minutes) from context. */
  selectedServiceDuration?: number | null;
  /** The selected time slot from context. */
  selectedTime?: string | null;
  /** The selected staff member name from context. */
  selectedStaffName?: string | null;
  /** The booking ID from context. */
  bookingId?: string | null;
}

/** Regex to match any {{...}} placeholder. */
const PLACEHOLDER_REGEX = /\{\{[^}]+\}\}/g;

/**
 * Build a variable map from params that maps variable keys to their resolved values.
 * This handles both legacy and dot-path variable formats.
 */
function buildVariableMap(params: TemplateResolverParams): Record<string, string> {
  const businessName = params.businessName || 'the business';
  const serviceTerm = getServiceTerm(params.category);
  const servicePluralTerm = getServicePluralTerm(params.category);

  const map: Record<string, string> = {
    // Legacy variables (backward compat)
    'businessName': businessName,
    'serviceTerm': serviceTerm,
    'servicePluralTerm': servicePluralTerm,

    // Dot-path variables
    'business.name': businessName,
    'business.category': params.category || '',
    'business.routingCode': params.routingCode || '',
    'selectedService.name': params.selectedServiceName || '',
    'selectedService.price': params.selectedServicePrice != null ? String(params.selectedServicePrice) : '',
    'selectedService.duration': params.selectedServiceDuration != null ? String(params.selectedServiceDuration) : '',
    'selectedTime': params.selectedTime || '',
    'selectedStaff.name': params.selectedStaffName || '',
    'booking.id': params.bookingId || '',
  };

  return map;
}

/**
 * Resolve all supported placeholders in a template string.
 *
 * Substitutes all registered variables (legacy and dot-path) and replaces
 * any remaining unresolvable {{...}} placeholders with empty string.
 */
export function resolveTemplate(
  template: string,
  params: TemplateResolverParams,
): string {
  const variableMap = buildVariableMap(params);

  return template.replace(PLACEHOLDER_REGEX, (match) => {
    // Extract the variable key from {{key}}
    const key = match.slice(2, -2);
    if (key in variableMap) {
      return variableMap[key];
    }
    // Unresolvable variables → empty string
    return '';
  });
}

/**
 * TemplateResolver class providing an object-oriented interface for
 * resolving templates within a specific business context.
 *
 * Useful when resolving multiple templates for the same business in a
 * single handler invocation.
 */
export class TemplateResolver {
  private readonly variableMap: Record<string, string>;

  constructor(params: TemplateResolverParams) {
    this.variableMap = buildVariableMap(params);
  }

  /** Resolve all placeholders in the given template string. */
  resolve(template: string): string {
    return template.replace(PLACEHOLDER_REGEX, (match) => {
      const key = match.slice(2, -2);
      if (key in this.variableMap) {
        return this.variableMap[key];
      }
      // Unresolvable variables → empty string
      return '';
    });
  }

  /** Get the singular service term for this resolver's category. */
  getServiceTerm(): string {
    return this.variableMap['serviceTerm'];
  }

  /** Get the plural service term for this resolver's category. */
  getServicePluralTerm(): string {
    return this.variableMap['servicePluralTerm'];
  }

  /** Get the resolved business name. */
  getBusinessName(): string {
    return this.variableMap['businessName'];
  }
}
