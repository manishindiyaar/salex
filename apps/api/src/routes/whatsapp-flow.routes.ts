/**
 * WhatsApp Flow Data Exchange Routes
 *
 * POST /api/v1/whatsapp/flows/business-selection
 *   - Meta WhatsApp Flows data exchange endpoint
 *   - Handles encrypted requests from the WhatsApp client
 *   - Returns salon search results for the business selection Flow
 */

import { Router } from 'express';
import { whatsappFlowController } from '../controllers/whatsapp-flow.controller';

const router = Router();

// Public endpoint — Meta sends encrypted requests here (no auth middleware)
router.post('/business-selection', whatsappFlowController.handleDataExchange);

export { router as whatsappFlowRoutes };
