import { DailyAnalyticsResponse } from 'shared-types';

export class DailyAnalyticsDto implements DailyAnalyticsResponse {
  businessId: string;
  date: string;
  totalBookings: number;
  totalRevenue: number;
  timezone: string;

  constructor(data: DailyAnalyticsResponse) {
    this.businessId = data.businessId;
    this.date = data.date;
    this.totalBookings = data.totalBookings;
    this.totalRevenue = data.totalRevenue;
    this.timezone = data.timezone;
  }
}