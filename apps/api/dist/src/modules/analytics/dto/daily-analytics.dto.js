"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyAnalyticsDto = void 0;
class DailyAnalyticsDto {
    constructor(data) {
        this.businessId = data.businessId;
        this.date = data.date;
        this.totalBookings = data.totalBookings;
        this.totalRevenue = data.totalRevenue;
        this.timezone = data.timezone;
    }
}
exports.DailyAnalyticsDto = DailyAnalyticsDto;
//# sourceMappingURL=daily-analytics.dto.js.map