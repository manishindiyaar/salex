import { IsOptional, IsString, IsDateString } from 'class-validator';

export class AnalyticsQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'Date must be in YYYY-MM-DD format' })
  date?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}