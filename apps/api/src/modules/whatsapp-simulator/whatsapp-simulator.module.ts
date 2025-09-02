import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SimulatorController } from './simulator.controller';
import { WhatsAppSimulatorController } from './whatsapp-simulator.controller';
// import { SimulatorWebhookController } from './controllers/simulator-webhook.controller';
import { WebhookEnhancerService } from './webhook-enhancer.service';
import { MockResponseService } from './mock-response.service';
import { MessageTypeRouterService } from './services/message-type-router.service';
import { BusinessApiRouterService } from './services/business-api-router.service';
import { BusinessResponseTransformerService } from './services/business-response-transformer.service';
import { SimulatorMessageStoreService } from './services/simulator-message-store.service';
import { PrismaService } from '../../core/prisma.service';
import { CustomerModule } from '../customer/customer.module';
import { BusinessModule } from '../business/business.module';
import { BookingModule } from '../booking/booking.module';
import { ServiceModule } from '../service/service.module';
import { TimeSlotsModule } from '../timeslots/timeslots.module';
import { MessageRoutingService } from './message-routing.service';
import { BookingFlowService } from './services/booking-flow.service';
import { SimulatorWebhookController } from './simulator-webhook.controller';

@Module({
  imports: [ConfigModule, CustomerModule, BusinessModule, BookingModule, ServiceModule, TimeSlotsModule],
  controllers: [SimulatorController, WhatsAppSimulatorController, SimulatorWebhookController],
  providers: [
    WebhookEnhancerService,
    MockResponseService,
    MessageRoutingService,
    MessageTypeRouterService,
    BusinessApiRouterService,
    BusinessResponseTransformerService,
    SimulatorMessageStoreService,
    BookingFlowService,
    PrismaService,
  ],
  exports: [
    WebhookEnhancerService,
    MockResponseService,
    MessageTypeRouterService,
    BusinessApiRouterService,
    BusinessResponseTransformerService,
  ],
})
export class WhatsAppSimulatorModule {}