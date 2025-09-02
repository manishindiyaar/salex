// packages/shared-types/src/types/whatsapp-api-types.ts
export interface WhatsAppWebhookPayload {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: "whatsapp";
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: WhatsAppMessage[];
      };
      field: "messages";
    }>;
  }>;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: "text" | "interactive" | "image" | "audio" | "document" | "video" | "button" | "quick_reply";
  text?: {
    body: string;
  };
  interactive?: WhatsAppInteractive;
  button?: WhatsAppButtonMessage;
  quick_reply?: WhatsAppQuickReply;
  image?: {
    id: string;
    caption?: string;
    mime_type: string;
  };
  document?: {
    id: string;
    filename: string;
    mime_type: string;
  };
  context?: WhatsAppMessageContext;
}

export interface WhatsAppInteractive {
  type: "button_reply" | "list_reply" | "quick_reply";
  button_reply?: {
    id: string;
    title: string;
  };
  list_reply?: {
    id: string;
    title: string;
    description?: string;
  };
  quick_reply?: {
    id: string;
    title: string;
  };
}

export interface WhatsAppButtonMessage {
  text: string;
  payload: string;
}

export interface WhatsAppQuickReply {
  id: string;
  title: string;
  payload?: string;
}

export interface WhatsAppMessageContext {
  from: string;
  id: string;
  referred_product?: {
    catalog_id: string;
    product_retailer_id: string;
  };
}

export interface WhatsAppInteractiveMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "interactive" | "text";
  text?: {
    body: string;
  };
  interactive?: {
    type: "button" | "list" | "quick_reply";
    header?: {
      type: "text" | "image" | "document" | "video";
      text?: string;
      image?: { id: string };
      document?: { id: string; filename?: string };
      video?: { id: string };
    };
    body: {
      text: string;
    };
    footer?: {
      text: string;
    };
    action: {
      buttons?: Array<{
        type: "reply";
        reply: {
          id: string;
          title: string;
        };
      }>;
      quick_replies?: Array<{
        type: "reply";
        reply: {
          id: string;
          title: string;
        };
      }>;
      sections?: Array<{
        title: string;
        rows: Array<{
          id: string;
          title: string;
          description?: string;
        }>;
      }>;
      button?: string; // For list messages
    };
  };
}

export interface WhatsAppTemplateMessage {
  messaging_product: "whatsapp";
  to: string;
  type: "template";
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: "body" | "header" | "footer" | "button";
      parameters?: Array<{
        type: "text" | "currency" | "date_time";
        text?: string;
        currency?: {
          fallback_value: string;
          code: string;
          amount: number;
        };
        date_time?: {
          fallback_value: string;
        };
      }>;
    }>;
  };
}

export interface WhatsAppBusinessConfig {
  accessToken: string;
  phoneNumberId: string;
  webhookSecret: string;
  webhookEndpoint: string;
}

export interface WhatsAppError {
  code: string;
  message: string;
  details?: string;
}

export interface WhatsAppDeliveryReceipt {
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: "whatsapp";
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        statuses: Array<{
          id: string;
          message: WhatsAppMessage;
          timestamp: string;
          type: "delivery" | "read";
        }>;
      };
      field: "statuses";
    }>;
  }>;
}

export interface WhatsAppAPIResponse {
  id: string;
  message_count?: number;
  error?: WhatsAppError;
}

export interface WhatsAppRateLimits {
  maxMessagesPerSecond: number;
  maxMessagesPerMinute: number;
  maxMessagesPerDay: number;
}

export interface WhatsAppContact {
  input: string;
  wa_id: string;
  profile: {
    name: string;
  };
}