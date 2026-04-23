import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

const uuidv4 = () => crypto.randomUUID();

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    // Generate request ID for tracing
    const requestId = uuidv4();
    (req as Request & { requestId: string })['requestId'] = requestId;

    // Add to response headers
    res.setHeader('X-Request-ID', requestId);

    // Log when response finishes
    res.on('finish', () => {
      const { method, originalUrl } = req;
      const { statusCode } = res;

      this.logger.log({
        requestId,
        method,
        url: originalUrl,
        statusCode,
        userAgent: req.get('user-agent'),
        // ip: req.ip,
      });
    });

    next();
  }
}
