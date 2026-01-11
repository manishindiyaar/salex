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
import { simulatorController } from '../controllers/simulator.controller';

const router: Router = Router();

// Health check
router.get('/health', simulatorController.health);

// Send messages
router.post('/send', simulatorController.sendMessage.bind(simulatorController));
router.post('/send-interactive', simulatorController.sendInteractive.bind(simulatorController));

// Poll for responses
router.get('/poll', simulatorController.pollMessages.bind(simulatorController));

// Business search
router.get('/businesses/search/:code', simulatorController.searchBusiness.bind(simulatorController));

// Conversation debugging
router.get('/conversations/:customerPhone', simulatorController.getConversation.bind(simulatorController));
router.get('/conversations/:customerPhone/messages', simulatorController.getMessages.bind(simulatorController));
router.delete('/conversations/:customerPhone', simulatorController.clearConversation.bind(simulatorController));

export default router;

// Legacy webhook route (for WhatsApp Mock UI compatibility)
export const simulatorWebhookRouter: Router = Router();
simulatorWebhookRouter.post('/whatsapp', simulatorController.handleWebhook.bind(simulatorController));
