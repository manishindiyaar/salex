/**
 * WhatsApp Simulator Routes
 *
 * Development-only routes for testing WhatsApp booking flow
 * without the actual WhatsApp Cloud API.
 *
 * Endpoints:
 * - POST /api/v1/whatsapp-simulator/send - Send customer message
 * - POST /api/v1/whatsapp-simulator/send-interactive - Send interactive reply
 * - GET /api/v1/whatsapp-simulator/poll - Poll for bot responses
 * - GET /api/v1/whatsapp-simulator/businesses/search/:code - Find business
 * - GET /api/v1/whatsapp-simulator/conversations/:customerPhone - Debug state
 * - GET /api/v1/whatsapp-simulator/conversations/:customerPhone/messages - Get messages
 * - DELETE /api/v1/whatsapp-simulator/conversations/:customerPhone - Reset
 * - GET /api/v1/whatsapp-simulator/health - Health check
 */
import { Router } from 'express';
declare const router: Router;
export default router;
export declare const simulatorWebhookRouter: Router;
//# sourceMappingURL=simulator.routes.d.ts.map