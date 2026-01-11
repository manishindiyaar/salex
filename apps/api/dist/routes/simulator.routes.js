"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulatorWebhookRouter = void 0;
const express_1 = require("express");
const simulator_controller_1 = require("../controllers/simulator.controller");
const router = (0, express_1.Router)();
// Health check
router.get('/health', simulator_controller_1.simulatorController.health);
// Send messages
router.post('/send', simulator_controller_1.simulatorController.sendMessage.bind(simulator_controller_1.simulatorController));
router.post('/send-interactive', simulator_controller_1.simulatorController.sendInteractive.bind(simulator_controller_1.simulatorController));
// Poll for responses
router.get('/poll', simulator_controller_1.simulatorController.pollMessages.bind(simulator_controller_1.simulatorController));
// Business search
router.get('/businesses/search/:code', simulator_controller_1.simulatorController.searchBusiness.bind(simulator_controller_1.simulatorController));
// Conversation debugging
router.get('/conversations/:customerPhone', simulator_controller_1.simulatorController.getConversation.bind(simulator_controller_1.simulatorController));
router.get('/conversations/:customerPhone/messages', simulator_controller_1.simulatorController.getMessages.bind(simulator_controller_1.simulatorController));
router.delete('/conversations/:customerPhone', simulator_controller_1.simulatorController.clearConversation.bind(simulator_controller_1.simulatorController));
exports.default = router;
// Legacy webhook route (for WhatsApp Mock UI compatibility)
exports.simulatorWebhookRouter = (0, express_1.Router)();
exports.simulatorWebhookRouter.post('/whatsapp', simulator_controller_1.simulatorController.handleWebhook.bind(simulator_controller_1.simulatorController));
//# sourceMappingURL=simulator.routes.js.map