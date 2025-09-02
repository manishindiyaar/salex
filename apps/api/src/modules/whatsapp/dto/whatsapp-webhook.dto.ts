import { IsString, IsArray, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class WhatsAppContactDto {
  @IsString()
  profile: string;

  @IsString()
  wa_id: string;
}

export class WhatsAppTextDto {
  @IsString()
  body: string;
}

// Interactive message DTOs for button and list replies
export class WhatsAppButtonReplyDto {
  @IsString()
  id: string;

  @IsString()
  title: string;
}

export class WhatsAppListReplyDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class WhatsAppInteractiveDto {
  @IsString()
  type: string; // 'button_reply' or 'list_reply'

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppButtonReplyDto)
  button_reply?: WhatsAppButtonReplyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppListReplyDto)
  list_reply?: WhatsAppListReplyDto;
}

// Message status DTO
export class WhatsAppStatusDto {
  @IsString()
  id: string;

  @IsString()
  status: string; // 'sent', 'delivered', 'read', 'failed'

  @IsString()
  timestamp: string;

  @IsOptional()
  @IsString()
  recipient_id?: string;
}

export class WhatsAppMessageDto {
  @IsString()
  from: string;

  @IsString()
  id: string;

  @IsString()
  timestamp: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppTextDto)
  text?: WhatsAppTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WhatsAppInteractiveDto)
  interactive?: WhatsAppInteractiveDto;

  @IsString()
  type: string; // 'text', 'interactive', etc.
}

export class WhatsAppMetadataDto {
  @IsString()
  display_phone_number: string;

  @IsString()
  phone_number_id: string;
}

export class WhatsAppValueDto {
  @IsString()
  messaging_product: string;

  @ValidateNested()
  @Type(() => WhatsAppMetadataDto)
  metadata: WhatsAppMetadataDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppContactDto)
  contacts?: WhatsAppContactDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppMessageDto)
  messages?: WhatsAppMessageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppStatusDto)
  statuses?: WhatsAppStatusDto[];
}

export class WhatsAppChangeDto {
  @IsString()
  field: string;

  @ValidateNested()
  @Type(() => WhatsAppValueDto)
  value: WhatsAppValueDto;
}

export class WhatsAppEntryDto {
  @IsString()
  id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppChangeDto)
  changes: WhatsAppChangeDto[];
}

export class WhatsAppWebhookPayloadDto {
  @IsString()
  object: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WhatsAppEntryDto)
  entry: WhatsAppEntryDto[];
}

export class WhatsAppVerificationDto {
  @IsString()
  'hub.mode': string;

  @IsString()
  'hub.challenge': string;

  @IsString()
  'hub.verify_token': string;
}