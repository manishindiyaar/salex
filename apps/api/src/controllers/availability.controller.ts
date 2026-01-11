/**
 * Availability Controller
 * 
 * HTTP handlers for availability and capacity endpoints.
 * 
 * Endpoints:
 * - GET /v1/businesses/:businessId/availability - Check availability
 * - GET /v1/businesses/:businessId/capacity - Get capacity info
 */

import { Response, NextFunction } from 'express';
import { availabilityService } from '../services/availability.service';
import { prisma } from '@salex/shared-types';
import { AuthRequest } from '../middlewares/auth.middleware';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

class AvailabilityController {
  /**
   * Check availability for a time slot
   * GET /v1/businesses/:businessId/availability
   * 
   * Query params:
   * - scheduledAt: ISO datetime string
   * - endAt: ISO datetime string (optional)
   * - durationMinutes: number (optional, used if endAt not provided)
   * - resourceId: string (optional, filter by specific resource)
   * - staffId: string (optional, filter by specific staff)
   * - preferredStaffId: string (optional, customer preference)
   */
  async checkAvailability(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { businessId } = req.params;
      
      // Verify business ownership and status
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true, isActive: true },
      });

      if (!business) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Business not found' },
        });
        return;
      }

      if (business.ownerId !== req.auth.userId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only check availability for your own business' },
        });
        return;
      }

      // Check if business is active (not suspended by admin)
      if (!business.isActive) {
        res.status(403).json({
          success: false,
          error: { code: 'BUSINESS_SUSPENDED', message: 'Business account is suspended. Please contact support.' },
        });
        return;
      }
      
      const { scheduledAt, endAt, durationMinutes, resourceId, staffId, preferredStaffId } = req.query;

      if (!scheduledAt) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'scheduledAt is required' },
        });
        return;
      }

      const requestedStart = new Date(scheduledAt as string);
      let requestedEnd: Date;

      if (endAt) {
        requestedEnd = new Date(endAt as string);
      } else if (durationMinutes) {
        requestedEnd = availabilityService.calculateEndTime(
          requestedStart,
          parseInt(durationMinutes as string, 10)
        );
      } else {
        // Default to 30 minutes
        requestedEnd = availabilityService.calculateEndTime(requestedStart, 30);
      }

      const availability = await availabilityService.getAvailabilityWithSuggestions(
        businessId,
        requestedStart,
        requestedEnd,
        preferredStaffId as string | undefined
      );

      // Filter by specific resource if requested
      if (resourceId) {
        availability.availableResources = availability.availableResources.filter(
          r => r.id === resourceId
        );
      }

      // Filter by specific staff if requested
      if (staffId) {
        availability.availableStaff = availability.availableStaff.filter(
          s => s.id === staffId
        );
      }

      res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get capacity info for a business
   * GET /v1/businesses/:businessId/capacity
   */
  async getCapacity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;

      // Verify business ownership and status
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true, isActive: true },
      });

      if (!business) {
        throw new NotFoundError('Business not found');
      }

      if (business.ownerId !== req.auth.userId) {
        throw new BusinessRuleError('You can only check capacity for your own business');
      }

      // Check if business is active (not suspended by admin)
      if (!business.isActive) {
        throw new BusinessRuleError('Business account is suspended. Please contact support.');
      }

      const capacity = await availabilityService.getEffectiveCapacity(businessId);

      res.json({
        success: true,
        data: capacity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available resources for a time slot
   * GET /v1/businesses/:businessId/availability/resources
   */
  async getAvailableResources(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { businessId } = req.params;
      
      // Verify business ownership and status
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true, isActive: true },
      });

      if (!business) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Business not found' },
        });
        return;
      }

      if (business.ownerId !== req.auth.userId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only check resources for your own business' },
        });
        return;
      }

      // Check if business is active (not suspended by admin)
      if (!business.isActive) {
        res.status(403).json({
          success: false,
          error: { code: 'BUSINESS_SUSPENDED', message: 'Business account is suspended. Please contact support.' },
        });
        return;
      }
      
      const { scheduledAt, endAt, durationMinutes } = req.query;

      if (!scheduledAt) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'scheduledAt is required' },
        });
        return;
      }

      const requestedStart = new Date(scheduledAt as string);
      let requestedEnd: Date;

      if (endAt) {
        requestedEnd = new Date(endAt as string);
      } else if (durationMinutes) {
        requestedEnd = availabilityService.calculateEndTime(
          requestedStart,
          parseInt(durationMinutes as string, 10)
        );
      } else {
        requestedEnd = availabilityService.calculateEndTime(requestedStart, 30);
      }

      const resources = await availabilityService.getAvailableResources(
        businessId,
        requestedStart,
        requestedEnd
      );

      res.json({
        success: true,
        data: { resources },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available staff for a time slot
   * GET /v1/businesses/:businessId/availability/staff
   */
  async getAvailableStaff(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { businessId } = req.params;
      
      // Verify business ownership and status
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { ownerId: true, isActive: true },
      });

      if (!business) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Business not found' },
        });
        return;
      }

      if (business.ownerId !== req.auth.userId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only check staff for your own business' },
        });
        return;
      }

      // Check if business is active (not suspended by admin)
      if (!business.isActive) {
        res.status(403).json({
          success: false,
          error: { code: 'BUSINESS_SUSPENDED', message: 'Business account is suspended. Please contact support.' },
        });
        return;
      }
      
      const { scheduledAt, endAt, durationMinutes } = req.query;

      if (!scheduledAt) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'scheduledAt is required' },
        });
        return;
      }

      const requestedStart = new Date(scheduledAt as string);
      let requestedEnd: Date;

      if (endAt) {
        requestedEnd = new Date(endAt as string);
      } else if (durationMinutes) {
        requestedEnd = availabilityService.calculateEndTime(
          requestedStart,
          parseInt(durationMinutes as string, 10)
        );
      } else {
        requestedEnd = availabilityService.calculateEndTime(requestedStart, 30);
      }

      const staff = await availabilityService.getAvailableStaff(
        businessId,
        requestedStart,
        requestedEnd
      );

      res.json({
        success: true,
        data: { staff },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();
