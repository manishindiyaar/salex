/**
 * Admin Business Management Controller
 * 
 * Handles admin operations for business management including:
 * - Listing and searching businesses
 * - Viewing business details with analytics
 * - Toggling business active status
 * - Changing subscription plans
 */

import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '@salex/shared-types';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError, BusinessRuleError } from '../utils/errors';
import { AdminRequest } from '../middlewares/admin-auth.middleware';
import { subscriptionService } from '../services/subscription.service';
import { auditLogService } from '../services/audit-log.service';

// Validation schemas
const ListBusinessesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  plan: z.enum(['BASIC', 'PRO', 'CUSTOM']).optional(),
  status: z.enum(['TRIAL', 'ACTIVE', 'GRACE', 'EXPIRED', 'CANCELLED']).optional(),
  category: z.enum(['SALON', 'BEAUTY_PARLOR', 'SPA', 'CLINIC', 'FITNESS', 'OTHER']).optional(),
  isActive: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
});

const ChangePlanSchema = z.object({
  plan: z.enum(['BASIC', 'PRO', 'CUSTOM']),
  reason: z.string().min(1, 'Reason is required for plan changes'),
});

const ToggleStatusSchema = z.object({
  reason: z.string().min(1, 'Reason is required for status changes'),
});

const SupportNoteSchema = z.object({
  body: z.string().min(1, 'Support note is required').max(2000),
  status: z.enum(['OPEN', 'FOLLOW_UP', 'RESOLVED']).default('OPEN'),
});

class AdminBusinessController {
  /**
   * GET /v1/admin/businesses
   * List all businesses with pagination, search, and filters
   */
  async listBusinesses(req: AdminRequest, res: Response) {
    try {
      const query = ListBusinessesSchema.parse(req.query);
      const { page, limit, search, plan, status, category, isActive } = query;

      const offset = (page - 1) * limit;

      // Build where clause for filtering
      const where: any = {};

      // Search by name, phone, or routing code
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search } },
          { routingCode: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Filter by category
      if (category) {
        where.category = category;
      }

      // Filter by active status
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // Filter by subscription plan and status
      if (plan || status) {
        where.subscription = {};
        if (plan) where.subscription.plan = plan;
        if (status) where.subscription.status = status;
      }

      // Get businesses with subscription and basic stats
      const [businesses, totalCount] = await Promise.all([
        prisma.business.findMany({
          where,
          include: {
            subscription: true,
            owner: {
              select: { id: true, phone: true },
            },
            _count: {
              select: {
                bookings: true,
                services: true,
                resources: true,
                staff: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.business.count({ where }),
      ]);

      // Calculate additional metrics for each business
      const businessesWithMetrics = await Promise.all(
        businesses.map(async (business) => {
          // Get recent booking count (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const recentBookings = await prisma.booking.count({
            where: {
              businessId: business.id,
              createdAt: { gte: thirtyDaysAgo },
            },
          });

          // Get total revenue (sum of completed bookings)
          const revenueResult = await prisma.booking.aggregate({
            where: {
              businessId: business.id,
              status: 'COMPLETED',
            },
            _sum: { totalPrice: true },
          });

          return {
            id: business.id,
            name: business.name,
            phoneNumber: business.phoneNumber,
            routingCode: business.routingCode,
            category: business.category,
            isActive: business.isActive,
            onboardingCompleted: business.onboardingCompleted,
            createdAt: business.createdAt,
            owner: business.owner,
            subscription: business.subscription,
            metrics: {
              totalBookings: business._count.bookings,
              recentBookings,
              totalRevenue: revenueResult._sum.totalPrice || 0,
              servicesCount: business._count.services,
              resourcesCount: business._count.resources,
              staffCount: business._count.staff,
            },
          };
        })
      );

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        success: true,
        data: {
          businesses: businessesWithMetrics,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters', error.errors);
      }
      throw error;
    }
  }

  /**
   * GET /v1/admin/businesses/:id
   * Get detailed business information with analytics
   */
  async getBusinessDetails(req: AdminRequest, res: Response) {
    const { id } = req.params;

    const business = await prisma.business.findUnique({
        where: { id },
        include: {
          subscription: {
            include: {
              payments: {
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
            },
          },
          owner: {
            select: { id: true, phone: true, createdAt: true },
          },
          services: {
            where: { isActive: true },
            select: { id: true, name: true, price: true, durationMinutes: true },
          },
          resources: {
            where: { isActive: true },
            select: { id: true, name: true, description: true },
          },
          staff: {
            where: { isActive: true },
            select: { id: true, name: true, phone: true },
          },
          whatsAppChannel: true,
          bookingAttempts: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          supportNotes: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              admin: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
          bookings: {
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: {
              customer: {
                select: { id: true, name: true, phoneNumber: true },
              },
              businessCustomer: {
                include: {
                  person: true,
                },
              },
              items: {
                include: {
                  service: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    // Calculate analytics
    const analytics = await this.calculateBusinessAnalytics(id);
    const whatsappMessages = await prisma.whatsAppMessage.findMany({
        where: {
          conversation: {
            businessId: id,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          conversation: {
            select: {
              id: true,
              customerPhone: true,
              state: true,
            },
          },
        },
    });

    const businessPayload = {
      ...business,
      whatsappChannels: business.whatsAppChannel ? [business.whatsAppChannel] : [],
      bookingDiagnostics: business.bookingAttempts,
      whatsappMessageAudit: whatsappMessages,
    };

    res.json({
      success: true,
      data: {
        business: businessPayload,
        analytics,
      },
    });
  }

  /**
   * POST /v1/admin/businesses/:id/toggle
   * Toggle business active status
   */
  async toggleBusinessStatus(req: AdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = ToggleStatusSchema.parse(req.body);

      const business = await prisma.business.findUnique({
        where: { id },
        select: { id: true, name: true, isActive: true },
      });

      if (!business) {
        throw new NotFoundError('Business not found');
      }

      const newStatus = !business.isActive;

      // Update business status
      const updatedBusiness = await prisma.business.update({
        where: { id },
        data: { isActive: newStatus },
      });

      // Create audit log entry
      await auditLogService.logBusinessStatusChange(
        req.admin.adminId,
        id,
        business.isActive,
        newStatus,
        reason
      );

      // Log the action
      logger.info(
        {
          adminId: req.admin.adminId,
          businessId: id,
          action: 'TOGGLE_BUSINESS_STATUS',
          previousStatus: business.isActive,
          newStatus,
          reason,
        },
        'Business status toggled by admin'
      );

      res.json({
        success: true,
        data: {
          business: updatedBusiness,
          message: `Business ${newStatus ? 'activated' : 'deactivated'} successfully`,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request data', error.errors);
      }
      throw error;
    }
  }

  /**
   * PATCH /v1/admin/businesses/:id/plan
   * Change business subscription plan
   */
  async changeSubscriptionPlan(req: AdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const { plan, reason } = ChangePlanSchema.parse(req.body);

      const business = await prisma.business.findUnique({
        where: { id },
        include: { subscription: true },
      });

      if (!business) {
        throw new NotFoundError('Business not found');
      }

      let subscription = business.subscription;

      if (!subscription) {
        // Automatically create a subscription if one doesn't exist to heal legacy/seeded data
        subscription = await prisma.subscription.create({
          data: {
            businessId: id,
            plan: 'BASIC',
            status: 'TRIAL',
            trialEndsAt: new Date(),
          },
        });
      }

      const oldPlan = subscription.plan;

      // Update subscription plan
      const updatedSubscription = await subscriptionService.updatePlan(
        subscription.id,
        plan
      );

      // Create audit log entry
      await auditLogService.logSubscriptionPlanChange(
        req.admin.adminId,
        subscription.id,
        id,
        oldPlan,
        plan,
        reason
      );

      // Log the action
      logger.info(
        {
          adminId: req.admin.adminId,
          businessId: id,
          subscriptionId: subscription.id,
          action: 'CHANGE_SUBSCRIPTION_PLAN',
          oldPlan,
          newPlan: plan,
          reason,
        },
        'Subscription plan changed by admin'
      );

      res.json({
        success: true,
        data: {
          subscription: updatedSubscription,
          message: `Plan changed from ${oldPlan} to ${plan}`,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request data', error.errors);
      }
      throw error;
    }
  }

  /**
   * GET /v1/admin/businesses/:id/diagnostics/bookings
   * Get recent booking attempts for a business.
   */
  async getBookingDiagnostics(req: AdminRequest, res: Response) {
    const { id } = req.params;

    await this.ensureBusinessExists(id);

    const attempts = await prisma.bookingAttempt.findMany({
      where: { businessId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        businessCustomer: {
          include: {
            person: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { attempts },
    });
  }

  /**
   * GET /v1/admin/businesses/:id/diagnostics/whatsapp
   * Get recent WhatsApp message audit rows for a business.
   */
  async getWhatsAppAudit(req: AdminRequest, res: Response) {
    const { id } = req.params;

    await this.ensureBusinessExists(id);

    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        conversation: {
          businessId: id,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        conversation: {
          select: {
            id: true,
            customerPhone: true,
            state: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { messages },
    });
  }

  /**
   * GET /v1/admin/businesses/:id/support-notes
   * List support notes for a business.
   */
  async listSupportNotes(req: AdminRequest, res: Response) {
    const { id } = req.params;

    await this.ensureBusinessExists(id);

    const notes = await prisma.supportNote.findMany({
      where: { businessId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.json({
      success: true,
      data: { notes },
    });
  }

  /**
   * POST /v1/admin/businesses/:id/support-notes
   * Create an internal support note for a business.
   */
  async createSupportNote(req: AdminRequest, res: Response) {
    try {
      const { id } = req.params;
      const data = SupportNoteSchema.parse(req.body);

      await this.ensureBusinessExists(id);

      const note = await prisma.supportNote.create({
        data: {
          businessId: id,
          adminId: req.admin.adminId,
          body: data.body,
          status: data.status,
        },
        include: {
          admin: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      await auditLogService.logAction({
        adminId: req.admin.adminId,
        action: 'CREATE_SUPPORT_NOTE',
        entityType: 'Business',
        entityId: id,
        changes: {
          noteId: note.id,
          status: note.status,
        },
        reason: 'Support note created',
      });

      res.status(201).json({
        success: true,
        data: { note },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid support note data', error.errors);
      }
      throw error;
    }
  }

  /**
   * PATCH /v1/admin/businesses/:id/support-notes/:noteId
   * Update the status of a support note.
   */
  async updateSupportNoteStatus(req: AdminRequest, res: Response) {
    try {
      const { id, noteId } = req.params;
      const UpdateSupportNoteSchema = z.object({
        status: z.enum(['OPEN', 'FOLLOW_UP', 'RESOLVED']),
      });
      const data = UpdateSupportNoteSchema.parse(req.body);

      await this.ensureBusinessExists(id);

      const note = await prisma.supportNote.findUnique({
        where: { id: noteId },
      });

      if (!note) {
        throw new NotFoundError('Support note not found');
      }

      if (note.businessId !== id) {
        throw new BusinessRuleError('Support note does not belong to this business');
      }

      const updatedNote = await prisma.supportNote.update({
        where: { id: noteId },
        data: { status: data.status },
        include: {
          admin: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      await auditLogService.logAction({
        adminId: req.admin.adminId,
        action: 'UPDATE_SUPPORT_NOTE_STATUS',
        entityType: 'SupportNote',
        entityId: noteId,
        changes: {
          oldStatus: note.status,
          newStatus: data.status,
        },
        reason: 'Support note status updated',
      });

      res.json({
        success: true,
        data: { note: updatedNote },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid support note status update data', error.errors);
      }
      throw error;
    }
  }

  /**
   * Calculate business analytics
   */
  private async calculateBusinessAnalytics(businessId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalBookings,
      recentBookings,
      weeklyBookings,
      totalRevenue,
      recentRevenue,
      weeklyRevenue,
      totalCustomers,
      recentCustomers,
    ] = await Promise.all([
      // Total bookings
      prisma.booking.count({
        where: { businessId },
      }),
      // Recent bookings (30 days)
      prisma.booking.count({
        where: {
          businessId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      // Weekly bookings (7 days)
      prisma.booking.count({
        where: {
          businessId,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      // Total revenue
      prisma.booking.aggregate({
        where: {
          businessId,
          status: 'COMPLETED',
        },
        _sum: { totalPrice: true },
      }),
      // Recent revenue (30 days)
      prisma.booking.aggregate({
        where: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { totalPrice: true },
      }),
      // Weekly revenue (7 days)
      prisma.booking.aggregate({
        where: {
          businessId,
          status: 'COMPLETED',
          createdAt: { gte: sevenDaysAgo },
        },
        _sum: { totalPrice: true },
      }),
      // Total unique customers
      prisma.businessCustomer.findMany({
        where: { businessId },
        select: { id: true },
      }),
      // Recent unique customers (30 days)
      prisma.businessCustomer.findMany({
        where: {
          businessId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { id: true },
      }),
    ]);

    return {
      bookings: {
        total: totalBookings,
        recent: recentBookings,
        weekly: weeklyBookings,
      },
      revenue: {
        total: totalRevenue._sum.totalPrice || 0,
        recent: recentRevenue._sum.totalPrice || 0,
        weekly: weeklyRevenue._sum.totalPrice || 0,
      },
      customers: {
        total: totalCustomers.length,
        recent: recentCustomers.length,
      },
    };
  }

  private async ensureBusinessExists(id: string) {
    const business = await prisma.business.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    return business;
  }
}

export const adminBusinessController = new AdminBusinessController();
