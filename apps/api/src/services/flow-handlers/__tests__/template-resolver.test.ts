import { describe, it, expect } from 'vitest';
import {
  getServiceTerm,
  getServicePluralTerm,
  resolveTemplate,
  TemplateResolver,
} from '../template-resolver';

describe('TemplateResolver', () => {
  describe('getServiceTerm', () => {
    it('returns "appointment" for CLINIC category', () => {
      expect(getServiceTerm('CLINIC')).toBe('appointment');
    });

    it('returns "service" for SALON category', () => {
      expect(getServiceTerm('SALON')).toBe('service');
    });

    it('returns "service" for BEAUTY_PARLOR category', () => {
      expect(getServiceTerm('BEAUTY_PARLOR')).toBe('service');
    });

    it('returns "service" for SPA category', () => {
      expect(getServiceTerm('SPA')).toBe('service');
    });

    it('returns "service" for FITNESS category', () => {
      expect(getServiceTerm('FITNESS')).toBe('service');
    });

    it('returns "service" for OTHER category', () => {
      expect(getServiceTerm('OTHER')).toBe('service');
    });

    it('returns "service" for undefined category', () => {
      expect(getServiceTerm(undefined)).toBe('service');
    });

    it('returns "service" for null category', () => {
      expect(getServiceTerm(null)).toBe('service');
    });
  });

  describe('getServicePluralTerm', () => {
    it('returns "appointments" for CLINIC category', () => {
      expect(getServicePluralTerm('CLINIC')).toBe('appointments');
    });

    it('returns "services" for SALON category', () => {
      expect(getServicePluralTerm('SALON')).toBe('services');
    });

    it('returns "services" for BEAUTY_PARLOR category', () => {
      expect(getServicePluralTerm('BEAUTY_PARLOR')).toBe('services');
    });

    it('returns "services" for SPA category', () => {
      expect(getServicePluralTerm('SPA')).toBe('services');
    });

    it('returns "services" for FITNESS category', () => {
      expect(getServicePluralTerm('FITNESS')).toBe('services');
    });

    it('returns "services" for OTHER category', () => {
      expect(getServicePluralTerm('OTHER')).toBe('services');
    });

    it('returns "services" for undefined category', () => {
      expect(getServicePluralTerm(undefined)).toBe('services');
    });

    it('returns "services" for null category', () => {
      expect(getServicePluralTerm(null)).toBe('services');
    });
  });

  describe('resolveTemplate', () => {
    it('substitutes {{businessName}} placeholder', () => {
      const result = resolveTemplate('Welcome to {{businessName}}!', {
        businessName: 'Acme Clinic',
        category: 'CLINIC',
      });
      expect(result).toBe('Welcome to Acme Clinic!');
    });

    it('substitutes {{serviceTerm}} placeholder for clinic', () => {
      const result = resolveTemplate('Book an {{serviceTerm}}', {
        category: 'CLINIC',
      });
      expect(result).toBe('Book an appointment');
    });

    it('substitutes {{serviceTerm}} placeholder for salon', () => {
      const result = resolveTemplate('Book a {{serviceTerm}}', {
        category: 'SALON',
      });
      expect(result).toBe('Book a service');
    });

    it('substitutes {{servicePluralTerm}} placeholder', () => {
      const result = resolveTemplate('View {{servicePluralTerm}}', {
        category: 'CLINIC',
      });
      expect(result).toBe('View appointments');
    });

    it('substitutes all placeholders in a single template', () => {
      const result = resolveTemplate(
        'Welcome to {{businessName}}! Select a {{serviceTerm}} to book. Tap to view {{servicePluralTerm}}.',
        { businessName: 'Health Plus', category: 'CLINIC' },
      );
      expect(result).toBe(
        'Welcome to Health Plus! Select a appointment to book. Tap to view appointments.',
      );
    });

    it('substitutes multiple occurrences of the same placeholder', () => {
      const result = resolveTemplate(
        '{{businessName}} offers great {{servicePluralTerm}}. Visit {{businessName}} today!',
        { businessName: 'Glow Salon', category: 'SALON' },
      );
      expect(result).toBe(
        'Glow Salon offers great services. Visit Glow Salon today!',
      );
    });

    it('falls back to "the business" when businessName is null', () => {
      const result = resolveTemplate('Welcome to {{businessName}}!', {
        businessName: null,
        category: 'SALON',
      });
      expect(result).toBe('Welcome to the business!');
    });

    it('falls back to "the business" when businessName is undefined', () => {
      const result = resolveTemplate('Welcome to {{businessName}}!', {
        category: 'SALON',
      });
      expect(result).toBe('Welcome to the business!');
    });

    it('replaces unknown placeholders with empty string', () => {
      const result = resolveTemplate('Hello {{unknownPlaceholder}}!', {
        businessName: 'Test',
        category: 'SALON',
      });
      expect(result).toBe('Hello !');
    });

    it('handles template with no placeholders', () => {
      const result = resolveTemplate('No placeholders here.', {
        businessName: 'Test',
        category: 'CLINIC',
      });
      expect(result).toBe('No placeholders here.');
    });

    it('handles empty template string', () => {
      const result = resolveTemplate('', {
        businessName: 'Test',
        category: 'CLINIC',
      });
      expect(result).toBe('');
    });
  });

  describe('TemplateResolver class', () => {
    it('resolves templates using the class interface', () => {
      const resolver = new TemplateResolver({
        businessName: 'City Clinic',
        category: 'CLINIC',
      });

      expect(resolver.resolve('Welcome to {{businessName}}!')).toBe(
        'Welcome to City Clinic!',
      );
      expect(resolver.resolve('Book an {{serviceTerm}}')).toBe(
        'Book an appointment',
      );
      expect(resolver.resolve('View {{servicePluralTerm}}')).toBe(
        'View appointments',
      );
    });

    it('exposes individual term accessors', () => {
      const resolver = new TemplateResolver({
        businessName: 'Zen Spa',
        category: 'SPA',
      });

      expect(resolver.getServiceTerm()).toBe('service');
      expect(resolver.getServicePluralTerm()).toBe('services');
      expect(resolver.getBusinessName()).toBe('Zen Spa');
    });

    it('uses default business name when not provided', () => {
      const resolver = new TemplateResolver({ category: 'CLINIC' });
      expect(resolver.getBusinessName()).toBe('the business');
      expect(resolver.resolve('{{businessName}}')).toBe('the business');
    });
  });

  describe('dot-path variables', () => {
    it('resolves {{business.name}} same as {{businessName}}', () => {
      const result = resolveTemplate(
        '{{business.name}} is {{businessName}}',
        { businessName: 'Acme', category: 'SALON' },
      );
      expect(result).toBe('Acme is Acme');
    });

    it('resolves {{business.category}}', () => {
      const result = resolveTemplate('Category: {{business.category}}', {
        category: 'CLINIC',
      });
      expect(result).toBe('Category: CLINIC');
    });

    it('resolves {{business.routingCode}}', () => {
      const result = resolveTemplate('Code: {{business.routingCode}}', {
        routingCode: 'ABC123',
      });
      expect(result).toBe('Code: ABC123');
    });

    it('resolves {{selectedService.name}}', () => {
      const result = resolveTemplate('Service: {{selectedService.name}}', {
        selectedServiceName: 'Haircut',
      });
      expect(result).toBe('Service: Haircut');
    });

    it('resolves {{selectedService.price}}', () => {
      const result = resolveTemplate('Price: {{selectedService.price}}', {
        selectedServicePrice: 50,
      });
      expect(result).toBe('Price: 50');
    });

    it('resolves {{selectedService.duration}}', () => {
      const result = resolveTemplate('Duration: {{selectedService.duration}} min', {
        selectedServiceDuration: 30,
      });
      expect(result).toBe('Duration: 30 min');
    });

    it('resolves {{selectedTime}}', () => {
      const result = resolveTemplate('Time: {{selectedTime}}', {
        selectedTime: '2024-01-15 10:00',
      });
      expect(result).toBe('Time: 2024-01-15 10:00');
    });

    it('resolves {{selectedStaff.name}}', () => {
      const result = resolveTemplate('Staff: {{selectedStaff.name}}', {
        selectedStaffName: 'Jane',
      });
      expect(result).toBe('Staff: Jane');
    });

    it('resolves {{booking.id}}', () => {
      const result = resolveTemplate('Booking: {{booking.id}}', {
        bookingId: 'bk_123',
      });
      expect(result).toBe('Booking: bk_123');
    });

    it('resolves all dot-path variables in a single template', () => {
      const result = resolveTemplate(
        'Hi! Your {{selectedService.name}} at {{business.name}} with {{selectedStaff.name}} is booked for {{selectedTime}}. Ref: {{booking.id}}',
        {
          businessName: 'Glow Spa',
          category: 'SPA',
          selectedServiceName: 'Massage',
          selectedStaffName: 'Alice',
          selectedTime: '3:00 PM',
          bookingId: 'bk_456',
        },
      );
      expect(result).toBe(
        'Hi! Your Massage at Glow Spa with Alice is booked for 3:00 PM. Ref: bk_456',
      );
    });

    it('replaces unresolvable dot-path variables with empty string', () => {
      const result = resolveTemplate(
        'Staff: {{selectedStaff.name}}, Time: {{selectedTime}}',
        { businessName: 'Test' },
      );
      expect(result).toBe('Staff: , Time: ');
    });

    it('replaces completely unknown variables with empty string', () => {
      const result = resolveTemplate('{{foo.bar}} and {{baz}}', {});
      expect(result).toBe(' and ');
    });

    it('handles null numeric values as empty string', () => {
      const result = resolveTemplate('Price: {{selectedService.price}}', {
        selectedServicePrice: null,
      });
      expect(result).toBe('Price: ');
    });

    it('handles zero price correctly', () => {
      const result = resolveTemplate('Price: {{selectedService.price}}', {
        selectedServicePrice: 0,
      });
      expect(result).toBe('Price: 0');
    });
  });

  describe('TemplateResolver class with dot-path variables', () => {
    it('resolves dot-path variables via class interface', () => {
      const resolver = new TemplateResolver({
        businessName: 'City Clinic',
        category: 'CLINIC',
        routingCode: 'CC01',
        selectedServiceName: 'Checkup',
        selectedServicePrice: 100,
        selectedServiceDuration: 45,
        selectedTime: '9:00 AM',
        selectedStaffName: 'Dr. Smith',
        bookingId: 'bk_789',
      });

      expect(resolver.resolve('{{business.name}}')).toBe('City Clinic');
      expect(resolver.resolve('{{business.category}}')).toBe('CLINIC');
      expect(resolver.resolve('{{business.routingCode}}')).toBe('CC01');
      expect(resolver.resolve('{{selectedService.name}}')).toBe('Checkup');
      expect(resolver.resolve('{{selectedService.price}}')).toBe('100');
      expect(resolver.resolve('{{selectedService.duration}}')).toBe('45');
      expect(resolver.resolve('{{selectedTime}}')).toBe('9:00 AM');
      expect(resolver.resolve('{{selectedStaff.name}}')).toBe('Dr. Smith');
      expect(resolver.resolve('{{booking.id}}')).toBe('bk_789');
    });

    it('replaces unresolvable variables with empty string via class', () => {
      const resolver = new TemplateResolver({ category: 'SALON' });
      expect(resolver.resolve('{{unknownVar}}')).toBe('');
      expect(resolver.resolve('{{some.nested.path}}')).toBe('');
    });
  });

});
