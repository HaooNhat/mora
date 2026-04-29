import { TracedRequest } from '@mora/api/common/interfaces/traced-request.interface';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: TracedRequest, res: Response, next: NextFunction): void {
    const requestId =
      (req.headers['x-request-id'] as string) ?? crypto.randomUUID();

    req.requestId = requestId;
    req.startTime = Date.now();

    res.setHeader('X-Request-ID', requestId);

    const logOnEnd = (event: 'finish' | 'close') => {
      res.removeListener('finish', onFinish);
      res.removeListener('close', onClose);

      const durationMs = Date.now() - req.startTime;
      const { statusCode } = res;

      const meta = {
        requestId,
        event,
        method: req.method,
        url: req.originalUrl,
        statusCode,
        durationMs,
        userAgent: req.headers['user-agent'],
        contentLength: res.getHeader('content-length') ?? 0,
      };

      if (statusCode >= 500) this.logger.error('Internal error', meta);
      else if (statusCode >= 400) this.logger.warn('User error', meta);
      else this.logger.log('Request ok', meta);
    };

    const onFinish = () => logOnEnd('finish');
    const onClose = () => logOnEnd('close');

    res.once('finish', onFinish);
    res.once('close', onClose);

    next();
  }
}
