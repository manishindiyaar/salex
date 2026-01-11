"use strict";
/**
 * @salex/shared-types
 *
 * Single source of truth for domain models, DTOs, API contracts,
 * Prisma client, and Zod validation schemas.
 *
 * IMPORTANT: App code must import exclusively from this package.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirstZodError = exports.getZodErrorMessages = exports.formatZodErrors = exports.Prisma = exports.PrismaClient = exports.prisma = void 0;
// ============================================
// PRISMA CLIENT & DATABASE
// ============================================
var db_1 = require("./db");
Object.defineProperty(exports, "prisma", { enumerable: true, get: function () { return db_1.prisma; } });
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return db_1.PrismaClient; } });
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return db_1.Prisma; } });
// ============================================
// ZOD SCHEMAS
// ============================================
__exportStar(require("./schemas"), exports);
// ============================================
// UTILITIES
// ============================================
var format_zod_errors_1 = require("./utils/format-zod-errors");
Object.defineProperty(exports, "formatZodErrors", { enumerable: true, get: function () { return format_zod_errors_1.formatZodErrors; } });
Object.defineProperty(exports, "getZodErrorMessages", { enumerable: true, get: function () { return format_zod_errors_1.getZodErrorMessages; } });
Object.defineProperty(exports, "getFirstZodError", { enumerable: true, get: function () { return format_zod_errors_1.getFirstZodError; } });
