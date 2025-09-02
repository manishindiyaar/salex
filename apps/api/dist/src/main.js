"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
const express = require("express");
const path = require("path");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://api.clerk.dev", "https://graph.facebook.com"],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    app.enableCors({
        origin: process.env.NODE_ENV === 'production'
            ? [process.env.EXPO_PUBLIC_API_URL]
            : true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-hub-signature-256', 'x-simulator-mode'],
    });
    const simulatorPath = path.join(__dirname, '../../../WhatsappMockUI');
    app.use('/simulator', express.static(simulatorPath));
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const port = process.env.API_PORT || 3000;
    const host = process.env.API_HOST || 'localhost';
    await app.listen(port, host);
    logger.log(`🚀 API Server running on http://${host}:${port}`);
    logger.log(`📱 WhatsApp webhook: http://${host}:${port}/webhooks/whatsapp`);
    logger.log(`🔐 Auth endpoints: http://${host}:${port}/api/v1/auth/*`);
    logger.log(`🏢 Business endpoints: http://${host}:${port}/api/v1/businesses/*`);
    logger.log(`📲 WhatsApp Simulator: http://${host}:${port}/simulator/whatsapp-simulator.html`);
    logger.log(`🛡️  Security features enabled: Rate limiting, CORS, Helmet, Input validation`);
    logger.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map