import { BusinessHours, DaySchedule } from 'shared-types';
export declare class DayScheduleDto implements DaySchedule {
    open: string;
    close: string;
    closed: boolean;
}
export declare class UpdateBusinessHoursDto implements BusinessHours {
    monday?: DayScheduleDto;
    tuesday?: DayScheduleDto;
    wednesday?: DayScheduleDto;
    thursday?: DayScheduleDto;
    friday?: DayScheduleDto;
    saturday?: DayScheduleDto;
    sunday?: DayScheduleDto;
}
export declare class UpdateBusinessHoursRequestDto {
    hoursOfOperation: UpdateBusinessHoursDto;
}
