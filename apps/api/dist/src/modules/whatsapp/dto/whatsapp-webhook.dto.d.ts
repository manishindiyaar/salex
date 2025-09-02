export declare class WhatsAppContactDto {
    profile: string;
    wa_id: string;
}
export declare class WhatsAppTextDto {
    body: string;
}
export declare class WhatsAppButtonReplyDto {
    id: string;
    title: string;
}
export declare class WhatsAppListReplyDto {
    id: string;
    title: string;
    description?: string;
}
export declare class WhatsAppInteractiveDto {
    type: string;
    button_reply?: WhatsAppButtonReplyDto;
    list_reply?: WhatsAppListReplyDto;
}
export declare class WhatsAppStatusDto {
    id: string;
    status: string;
    timestamp: string;
    recipient_id?: string;
}
export declare class WhatsAppMessageDto {
    from: string;
    id: string;
    timestamp: string;
    text?: WhatsAppTextDto;
    interactive?: WhatsAppInteractiveDto;
    type: string;
}
export declare class WhatsAppMetadataDto {
    display_phone_number: string;
    phone_number_id: string;
}
export declare class WhatsAppValueDto {
    messaging_product: string;
    metadata: WhatsAppMetadataDto;
    contacts?: WhatsAppContactDto[];
    messages?: WhatsAppMessageDto[];
    statuses?: WhatsAppStatusDto[];
}
export declare class WhatsAppChangeDto {
    field: string;
    value: WhatsAppValueDto;
}
export declare class WhatsAppEntryDto {
    id: string;
    changes: WhatsAppChangeDto[];
}
export declare class WhatsAppWebhookPayloadDto {
    object: string;
    entry: WhatsAppEntryDto[];
}
export declare class WhatsAppVerificationDto {
    'hub.mode': string;
    'hub.challenge': string;
    'hub.verify_token': string;
}
