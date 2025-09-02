export interface StoredMessage {
    id: string;
    customerPhone: string;
    content: any;
    timestamp: Date;
    type: 'sent' | 'received';
}
export declare class SimulatorMessageStoreService {
    private readonly logger;
    private readonly messages;
    private readonly maxMessagesPerCustomer;
    storeMessage(customerPhone: string, content: any, type: 'sent' | 'received'): void;
    getMessagesSince(customerPhone: string, since?: Date): StoredMessage[];
    getAllMessages(customerPhone: string): StoredMessage[];
    clearMessages(customerPhone: string): void;
    getStats(): {
        totalCustomers: number;
        totalMessages: number;
    };
    storeResponse(customerPhone: string, responseData: any): Promise<void>;
}
