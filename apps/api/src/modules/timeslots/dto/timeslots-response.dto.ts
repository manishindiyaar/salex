import { TimeSlot, TimeSlotsResponse, BusinessHours } from 'shared-types';

export class TimeSlotDto implements TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  date: string;
  duration: number;
}

export class TimeSlotsResponseDto implements TimeSlotsResponse {
  businessId: string;
  serviceId?: string;
  dateRange: {
    start: string;
    end: string;
  };
  slots: TimeSlotDto[];
  slotInterval: number;
  businessHours: BusinessHours;
}