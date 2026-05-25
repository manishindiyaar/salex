import { Router } from 'express';
import { whatsappWebhookController } from '../controllers/whatsapp-webhook.controller';
import { asyncHandler } from '../utils/async-handler';

const router: Router = Router();

router.get('/whatsapp', whatsappWebhookController.verify.bind(whatsappWebhookController));
router.post('/whatsapp', asyncHandler(whatsappWebhookController.receive.bind(whatsappWebhookController)));

export default router;
