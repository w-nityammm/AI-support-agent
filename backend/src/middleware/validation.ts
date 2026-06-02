import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

// Schema for POST /api/chat/message
export const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message is too long (max 10,000 characters)'),
  sessionId: z.string().uuid('Invalid sessionId format').optional(),
});

/**
 * Middleware factory that validates request body against a Zod schema.
 * Returns 400 with structured error details on validation failure.
 */
export function validateBody<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation error',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    // Attach parsed (and typed) data to the request
    (req as Request & { parsed: T }).parsed = result.data;
    next();
  };
}
