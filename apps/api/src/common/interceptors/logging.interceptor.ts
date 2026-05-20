import { TracedRequest } from '@mora/api/common/interfaces/traced-request.interface';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HANDLER');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<TracedRequest>();

    const controller = context.getClass().name;
    const handler = context.getHandler().name;

    // Read startTime set by middleware — single timestamp, consistent duration
    // Fallback guards against interceptor running without middleware (e.g. in tests)
    const getStartTime = () => req.startTime ?? Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log('Request completed', {
          requestId: req.requestId,
          controller,
          handler,
          durationMs: Date.now() - getStartTime(),
          // userId: req.user?.id,
        });
      }),
      catchError((error) => {
        const isError = error instanceof Error;

        this.logger.error('Request failed', {
          requestId: req.requestId,
          controller,
          handler,
          durationMs: Date.now() - getStartTime(),
          message: isError ? error.message : 'Unknown error',
          // Stack only in dev (performance + leaks)
          ...(process.env.NODE_ENV !== 'production' && {
            stack: isError ? error.stack : undefined,
          }),
        });

        // re-throw — GlobalExceptionFilter handles shape
        return throwError(() => error);
      }),
    );
  }
}
