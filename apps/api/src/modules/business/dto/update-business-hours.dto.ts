import { 
  IsObject, 
  ValidateNested, 
  IsOptional,
  IsString,
  IsBoolean,
  Matches
} from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessHours, DaySchedule } from 'shared-types';

export class DayScheduleDto implements DaySchedule {
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Open time must be in HH:MM format (24-hour)' 
  })
  open: string;

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { 
    message: 'Close time must be in HH:MM format (24-hour)' 
  })
  close: string;

  @IsBoolean()
  closed: boolean;
}

export class UpdateBusinessHoursDto implements BusinessHours {
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  monday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  tuesday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  wednesday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  thursday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  friday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  saturday?: DayScheduleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  sunday?: DayScheduleDto;
}

export class UpdateBusinessHoursRequestDto {
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateBusinessHoursDto)
  hoursOfOperation: UpdateBusinessHoursDto;
}