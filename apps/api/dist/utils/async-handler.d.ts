/**
 * Async Handler Utility
 *
 * Wraps async route handlers to catch errors and pass them to Express error middleware.
 */
import { Request, Response, NextFunction } from 'express';
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * Wraps an async function to catch errors and pass them to next()
 */
export declare function asyncHandler(fn: AsyncHandler): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=async-handler.d.ts.map