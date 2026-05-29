import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

const EXCLUDED_ROUTES = new Set(['/metrics', '/health']);

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const route: string =
      (req as Request & { route?: { path: string } }).route?.path ?? req.url;

    if (EXCLUDED_ROUTES.has(route)) return next.handle();

    const { method } = req;
    const start = process.hrtime.bigint();
    this.metrics.httpRequestsInFlight.inc();

    const record = (statusCode: number) => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const labels = { method, route, status_code: statusCode };
      this.metrics.httpRequestDuration.observe(labels, durationMs / 1000);
      this.metrics.httpRequestsTotal.inc(labels);
      this.metrics.httpRequestsInFlight.dec();
    };

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        record(res.statusCode);
      }),
      catchError((err) => {
        record((err as { status?: number }).status ?? 500);
        return throwError(() => err);
      }),
    );
  }
}
