/**
 * Simulator Controller
 *
 * Handles WhatsApp simulator endpoints for development testing.
 * These endpoints allow the WhatsApp Mock UI to:
 * - Send customer messages
 * - Poll for bot responses
 * - Search for businesses by routing code
 * - Debug conversation state
 */
import { Request, Response, NextFunction } from 'express';
declare class SimulatorController {
    /**
     * POST /api/v1/whatsapp-simulator/send
     * Send a customer message through the simulator
     */
    sendMessage(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/whatsapp-simulator/send-interactive
     * Send an interactive reply (button/list selection)
     */
    sendInteractive(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/whatsapp-simulator/poll
     * Poll for bot responses
     */
    pollMessages(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/whatsapp-simulator/businesses/search/:code
     * Search for a business by routing code
     */
    searchBusiness(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/whatsapp-simulator/conversations/:customerPhone
     * Get conversation state for debugging
     */
    getConversation(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/whatsapp-simulator/conversations/:customerPhone/messages
     * Get all messages for a conversation (debugging)
     */
    getMessages(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/whatsapp-simulator/conversations/:customerPhone
     * Clear conversation and messages (reset)
     */
    clearConversation(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/whatsapp-simulator/health
     * Simulator health check
     */
    health(_req: Request, res: Response): Promise<void>;
    /**
     * POST /simulate-webhooks/whatsapp
     * Legacy endpoint for WhatsApp Mock UI compatibility
     * Accepts raw WhatsApp Cloud API format webhooks
     */
    handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const simulatorController: SimulatorController;
export {};
//# sourceMappingURL=simulator.controller.d.ts.map