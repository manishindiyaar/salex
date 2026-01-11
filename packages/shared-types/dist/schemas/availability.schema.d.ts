/**
 * Availability Zod Schemas
 *
 * Schemas for availability checking and capacity management
 */
import { z } from 'zod';
export declare const availabilityRequestSchema: z.ZodObject<{
    scheduledAt: z.ZodString;
    endAt: z.ZodOptional<z.ZodString>;
    durationMinutes: z.ZodOptional<z.ZodNumber>;
    resourceId: z.ZodOptional<z.ZodString>;
    staffId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    scheduledAt: string;
    durationMinutes?: number | undefined;
    resourceId?: string | undefined;
    staffId?: string | undefined;
    endAt?: string | undefined;
}, {
    scheduledAt: string;
    durationMinutes?: number | undefined;
    resourceId?: string | undefined;
    staffId?: string | undefined;
    endAt?: string | undefined;
}>;
export type AvailabilityRequest = z.infer<typeof availabilityRequestSchema>;
export declare const multiSlotAvailabilityRequestSchema: z.ZodObject<{
    slots: z.ZodArray<z.ZodObject<{
        scheduledAt: z.ZodString;
        endAt: z.ZodOptional<z.ZodString>;
        durationMinutes: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        scheduledAt: string;
        durationMinutes?: number | undefined;
        endAt?: string | undefined;
    }, {
        scheduledAt: string;
        durationMinutes?: number | undefined;
        endAt?: string | undefined;
    }>, "many">;
    resourceId: z.ZodOptional<z.ZodString>;
    staffId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    slots: {
        scheduledAt: string;
        durationMinutes?: number | undefined;
        endAt?: string | undefined;
    }[];
    resourceId?: string | undefined;
    staffId?: string | undefined;
}, {
    slots: {
        scheduledAt: string;
        durationMinutes?: number | undefined;
        endAt?: string | undefined;
    }[];
    resourceId?: string | undefined;
    staffId?: string | undefined;
}>;
export type MultiSlotAvailabilityRequest = z.infer<typeof multiSlotAvailabilityRequestSchema>;
export declare const availableResourceSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    utilizationPercent: z.ZodNumber;
    isLinkedStaffAvailable: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    utilizationPercent: number;
    isLinkedStaffAvailable: boolean;
}, {
    name: string;
    id: string;
    utilizationPercent: number;
    isLinkedStaffAvailable: boolean;
}>;
export type AvailableResource = z.infer<typeof availableResourceSchema>;
export declare const availableStaffSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    utilizationPercent: z.ZodNumber;
    linkedResourceIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    utilizationPercent: number;
    linkedResourceIds: string[];
}, {
    name: string;
    id: string;
    utilizationPercent: number;
    linkedResourceIds: string[];
}>;
export type AvailableStaff = z.infer<typeof availableStaffSchema>;
export declare const suggestedAssignmentSchema: z.ZodObject<{
    resourceId: z.ZodString;
    resourceName: z.ZodString;
    staffId: z.ZodString;
    staffName: z.ZodString;
    reason: z.ZodEnum<["lowest_utilization", "linked_pair_available", "customer_preference"]>;
}, "strip", z.ZodTypeAny, {
    resourceId: string;
    staffId: string;
    resourceName: string;
    staffName: string;
    reason: "lowest_utilization" | "linked_pair_available" | "customer_preference";
}, {
    resourceId: string;
    staffId: string;
    resourceName: string;
    staffName: string;
    reason: "lowest_utilization" | "linked_pair_available" | "customer_preference";
}>;
export type SuggestedAssignment = z.infer<typeof suggestedAssignmentSchema>;
export declare const availabilityResponseSchema: z.ZodObject<{
    available: z.ZodBoolean;
    availableResources: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        utilizationPercent: z.ZodNumber;
        isLinkedStaffAvailable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        utilizationPercent: number;
        isLinkedStaffAvailable: boolean;
    }, {
        name: string;
        id: string;
        utilizationPercent: number;
        isLinkedStaffAvailable: boolean;
    }>, "many">;
    availableStaff: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        utilizationPercent: z.ZodNumber;
        linkedResourceIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        utilizationPercent: number;
        linkedResourceIds: string[];
    }, {
        name: string;
        id: string;
        utilizationPercent: number;
        linkedResourceIds: string[];
    }>, "many">;
    suggestedAssignment: z.ZodNullable<z.ZodObject<{
        resourceId: z.ZodString;
        resourceName: z.ZodString;
        staffId: z.ZodString;
        staffName: z.ZodString;
        reason: z.ZodEnum<["lowest_utilization", "linked_pair_available", "customer_preference"]>;
    }, "strip", z.ZodTypeAny, {
        resourceId: string;
        staffId: string;
        resourceName: string;
        staffName: string;
        reason: "lowest_utilization" | "linked_pair_available" | "customer_preference";
    }, {
        resourceId: string;
        staffId: string;
        resourceName: string;
        staffName: string;
        reason: "lowest_utilization" | "linked_pair_available" | "customer_preference";
    }>>;
    effectiveCapacity: z.ZodNumber;
    currentUtilization: z.ZodNumber;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    available: boolean;
    availableResources: {
        name: string;
        id: string;
        utilizationPercent: number;
        isLinkedStaffAvailable: boolean;
    }[];
    availableStaff: {
        name: string;
        id: string;
        utilizationPercent: number;
        linkedResourceIds: string[];
    }[];
    suggestedAssignment: {
        resourceId: string;
        staffId: string;
        resourceName: string;
        staffName: string;
        reason: "lowest_utilization" | "linked_pair_available" | "customer_preference";
    } | null;
    effectiveCapacity: number;
    currentUtilization: number;
    message?: string | undefined;
}, {
    available: boolean;
    availableResources: {
        name: string;
        id: string;
        utilizationPercent: number;
        isLinkedStaffAvailable: boolean;
    }[];
    availableStaff: {
        name: string;
        id: string;
        utilizationPercent: number;
        linkedResourceIds: string[];
    }[];
    suggestedAssignment: {
        resourceId: string;
        staffId: string;
        resourceName: string;
        staffName: string;
        reason: "lowest_utilization" | "linked_pair_available" | "customer_preference";
    } | null;
    effectiveCapacity: number;
    currentUtilization: number;
    message?: string | undefined;
}>;
export type AvailabilityResponse = z.infer<typeof availabilityResponseSchema>;
export declare const capacityInfoSchema: z.ZodObject<{
    activeResources: z.ZodNumber;
    activeStaff: z.ZodNumber;
    effectiveCapacity: z.ZodNumber;
    warning: z.ZodOptional<z.ZodEnum<["staff_shortage", "resource_shortage", "zero_capacity"]>>;
    warningMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    effectiveCapacity: number;
    activeResources: number;
    activeStaff: number;
    warning?: "staff_shortage" | "resource_shortage" | "zero_capacity" | undefined;
    warningMessage?: string | undefined;
}, {
    effectiveCapacity: number;
    activeResources: number;
    activeStaff: number;
    warning?: "staff_shortage" | "resource_shortage" | "zero_capacity" | undefined;
    warningMessage?: string | undefined;
}>;
export type CapacityInfo = z.infer<typeof capacityInfoSchema>;
export declare const slotAvailabilitySchema: z.ZodObject<{
    scheduledAt: z.ZodString;
    endAt: z.ZodString;
    available: z.ZodBoolean;
    availableResources: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        utilizationPercent: z.ZodNumber;
        isLinkedStaffAvailable: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        utilizationPercent: number;
        isLinkedStaffAvailable: boolean;
    }, {
        name: string;
        id: string;
        utilizationPercent: number;
        isLinkedStaffAvailable: boolean;
    }>, "many">;
    availableStaff: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        utilizationPercent: z.ZodNumber;
        linkedResourceIds: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        utilizationPercent: number;
        linkedResourceIds: string[];
    }, {
        name: string;
        id: string;
        utilizationPercent: number;
        linkedResourceIds: string[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    scheduledAt: string;
    endAt: string;
    available: boolean;
    availableResources: {
        name: string;
        id: string;
        utilizationPercent: number;
        isLinkedStaffAvailable: boolean;
    }[];
    availableStaff: {
        name: string;
        id: string;
        utilizationPercent: number;
        linkedResourceIds: string[];
    }[];
}, {
    scheduledAt: string;
    endAt: string;
    available: boolean;
    availableResources: {
        name: string;
        id: string;
        utilizationPercent: number;
        isLinkedStaffAvailable: boolean;
    }[];
    availableStaff: {
        name: string;
        id: string;
        utilizationPercent: number;
        linkedResourceIds: string[];
    }[];
}>;
export type SlotAvailability = z.infer<typeof slotAvailabilitySchema>;
export declare const multiSlotAvailabilityResponseSchema: z.ZodObject<{
    slots: z.ZodArray<z.ZodObject<{
        scheduledAt: z.ZodString;
        endAt: z.ZodString;
        available: z.ZodBoolean;
        availableResources: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            utilizationPercent: z.ZodNumber;
            isLinkedStaffAvailable: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            utilizationPercent: number;
            isLinkedStaffAvailable: boolean;
        }, {
            name: string;
            id: string;
            utilizationPercent: number;
            isLinkedStaffAvailable: boolean;
        }>, "many">;
        availableStaff: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            utilizationPercent: z.ZodNumber;
            linkedResourceIds: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            name: string;
            id: string;
            utilizationPercent: number;
            linkedResourceIds: string[];
        }, {
            name: string;
            id: string;
            utilizationPercent: number;
            linkedResourceIds: string[];
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        scheduledAt: string;
        endAt: string;
        available: boolean;
        availableResources: {
            name: string;
            id: string;
            utilizationPercent: number;
            isLinkedStaffAvailable: boolean;
        }[];
        availableStaff: {
            name: string;
            id: string;
            utilizationPercent: number;
            linkedResourceIds: string[];
        }[];
    }, {
        scheduledAt: string;
        endAt: string;
        available: boolean;
        availableResources: {
            name: string;
            id: string;
            utilizationPercent: number;
            isLinkedStaffAvailable: boolean;
        }[];
        availableStaff: {
            name: string;
            id: string;
            utilizationPercent: number;
            linkedResourceIds: string[];
        }[];
    }>, "many">;
    effectiveCapacity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    slots: {
        scheduledAt: string;
        endAt: string;
        available: boolean;
        availableResources: {
            name: string;
            id: string;
            utilizationPercent: number;
            isLinkedStaffAvailable: boolean;
        }[];
        availableStaff: {
            name: string;
            id: string;
            utilizationPercent: number;
            linkedResourceIds: string[];
        }[];
    }[];
    effectiveCapacity: number;
}, {
    slots: {
        scheduledAt: string;
        endAt: string;
        available: boolean;
        availableResources: {
            name: string;
            id: string;
            utilizationPercent: number;
            isLinkedStaffAvailable: boolean;
        }[];
        availableStaff: {
            name: string;
            id: string;
            utilizationPercent: number;
            linkedResourceIds: string[];
        }[];
    }[];
    effectiveCapacity: number;
}>;
export type MultiSlotAvailabilityResponse = z.infer<typeof multiSlotAvailabilityResponseSchema>;
