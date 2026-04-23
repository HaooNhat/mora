import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();

    const req = context
      .switchToHttp()
      .getRequest<Request & { requestId?: string }>();
    const res = context.switchToHttp().getResponse<Response>();

    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    return next.handle().pipe(
      tap(() => {
        this.logger.log({
          requestId: req.requestId,
          controller,
          handler,
          statusCode: res.statusCode,
          duration: `${Date.now() - start}ms`,
        });
      }),
      catchError((error) => {
        this.logger.error({
          requestId: req.requestId,
          controller,
          handler,
          message: error.message,
          duration: `${Date.now() - start}ms`,
        });

        return throwError(() => error);
      }),
    );
  }
}
