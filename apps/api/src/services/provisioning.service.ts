/**
 * Provisioning Service
 * Creates merchant account + business + subscription in a single transaction.
 */

import { prisma } from '@salex/shared-types';
import type { AdminProvisionInput } from '@salex/shared-types';
import crypto from 'crypto';
import { hashPassword } from '../utils/password';
import { routingService } from './routing.service';
import { ConflictError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface ProvisionResult {
  user: { id: string; phone: string; mustChangePassword: boolean };
  business: { id: string; name: string; routingCode: string | null };
  subscription: { id: string; plan: string; status: string };
  temporaryPassword: string;
}

const CATEGORY_LABELS: Record<AdminProvisionInput['business']['category'], string> = {
  SALON: 'Salon',
  BEAUTY_PARLOR: 'Beauty Parlor',
  SPA: 'Spa',
  CLINIC: 'Clinic',
  FITNESS: 'Fitness Studio',
  OTHER: 'Business',
};

function generateTemporaryPassword(): string {
  const random = crypto.randomBytes(6).toString('base64url');
  return `Temp-${random}9`;
}

function getDefaultBusinessName(category: AdminProvisionInput['business']['category'], phone: string): string {
  const lastFourDigits = phone.replace(/\D/g, '').slice(-4);
  const suffix = lastFourDigits ? ` ${lastFourDigits}` : '';
  return `${CATEGORY_LABELS[category]}${suffix}`;
}

class ProvisioningService {
  async provision(input: AdminProvisionInput, adminId: string): Promise<ProvisionResult> {
    const phone = input.ownerPhone;
    const temporaryPassword = input.temporaryPassword ?? generateTemporaryPassword();
    const businessName = input.business.name ?? getDefaultBusinessName(input.business.category, phone);
    const businessPhoneNumber = input.business.phoneNumber ?? phone;

    // Check duplicate phone
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      throw new ConflictError('A user with this phone number already exists');
    }

    // Validate routing code uniqueness if provided
    const routingCode = input.business.routingCode || await routingService.generateUniqueCode();
    if (input.business.routingCode) {
      const taken = await routingService.isCodeTaken(input.business.routingCode);
      if (taken) {
        throw new ConflictError(`Routing code ${input.business.routingCode} is already in use`);
      }
    }

    const secretHash = await hashPassword(temporaryPassword);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          phone,
          role: 'OWNER',
          status: 'ACTIVE',
          mustChangePassword: true,
          phoneVerificationSource: 'ADMIN_ATTESTED',
          createdByAdminId: adminId,
        },
      });

      // 2. Create PASSWORD AuthMethod
      await tx.authMethod.create({
        data: {
          userId: user.id,
          type: 'PASSWORD',
          identifier: phone,
          secretHash,
          status: 'ENABLED',
        },
      });

      // 3. Create Business
      const hasOnboarding = !!(input.onboarding?.services?.length || input.onboarding?.resources?.length || input.onboarding?.staff?.length);
      const business = await tx.business.create({
        data: {
          ownerId: user.id,
          name: businessName,
          phoneNumber: businessPhoneNumber,
          category: input.business.category,
          routingCode,
          hoursOfOperation: input.onboarding?.hoursOfOperation ?? undefined,
          onboardingCompleted: hasOnboarding,
        },
      });

      // 4. Create Subscription
      const subPlan = input.subscription?.plan ?? 'BASIC';
      const subStatus = input.subscription?.status ?? 'TRIAL';
      const subscription = await tx.subscription.create({
        data: {
          businessId: business.id,
          plan: subPlan,
          status: subStatus,
          trialEndsAt: subStatus === 'TRIAL' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
        },
      });

      // 5. Optional onboarding data
      if (input.onboarding?.services?.length) {
        await tx.service.createMany({
          data: input.onboarding.services.map((s) => ({
            businessId: business.id,
            name: s.name,
            price: s.price,
            durationMinutes: s.durationMinutes,
            description: s.description,
          })),
        });
      }

      if (input.onboarding?.resources?.length) {
        await tx.resource.createMany({
          data: input.onboarding.resources.map((r, i) => ({
            businessId: business.id,
            name: r.name,
            description: r.description,
            displayOrder: i,
          })),
        });
      }

      if (input.onboarding?.staff?.length) {
        await tx.staff.createMany({
          data: input.onboarding.staff.map((s) => ({
            businessId: business.id,
            name: s.name,
            phone: s.phone,
          })),
        });
      }

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'ADMIN_PROVISION_MERCHANT',
          entityType: 'Business',
          entityId: business.id,
          changes: {
            userId: user.id,
            businessName: business.name,
            category: business.category,
            routingCode: business.routingCode,
            plan: subPlan,
          },
          reason: input.reason || 'Admin provisioned merchant account',
        },
      });

      return {
        user: { id: user.id, phone: user.phone, mustChangePassword: user.mustChangePassword },
        business: { id: business.id, name: business.name, routingCode: business.routingCode },
        subscription: { id: subscription.id, plan: subscription.plan, status: subscription.status },
        temporaryPassword,
      };
    });

    logger.info({ userId: result.user.id, businessId: result.business.id }, 'Merchant provisioned by admin');
    return result;
  }
}

export const provisioningService = new ProvisioningService();
