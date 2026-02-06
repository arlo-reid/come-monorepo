import { ArgumentsHost, Catch, type HttpServer } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';

/**
 * ZenStack ORM v3 error structure for policy violations.
 * ZenStack ORM throws ORMError with reason: "rejected-by-policy" for policy violations.
 */
interface ZenStackORMError {
  reason: string;
  rejectedByPolicyReason?: string;
  model?: string;
  message: string;
}

/**
 * Exception filter to convert ZenStack policy violations to HTTP 403 responses.
 *
 * Handles both:
 * - ZenStack ORM v3: ORMError with reason "rejected-by-policy"
 * - Legacy ZenStack: PrismaClientKnownRequestError with code P2004
 *
 * Extends BaseExceptionFilter to properly delegate non-ZenStack errors to NestJS.
 */
@Catch()
export class ZenStackExceptionFilter extends BaseExceptionFilter {
  constructor(applicationRef?: HttpServer) {
    super(applicationRef);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    if (typeof exception !== 'object' || exception === null) {
      super.catch(exception, host);
      return;
    }

    const err = exception as ZenStackORMError;

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (err.reason) {
      case 'rejected-by-policy':
        return response.status(403).json({
          statusCode: 403,
          message: 'Access denied by policy',
          error: 'Forbidden',
        });
      case 'not-found':
        return response.status(404).json({
          statusCode: 404,
          message: 'Resource not found',
          error: 'Not Found',
        });
      default:
        super.catch(exception, host);
    }
  }
}
