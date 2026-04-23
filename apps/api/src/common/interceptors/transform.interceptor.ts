import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { type ClassConstructor, plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

type ResponseType = Response;

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly dto: ClassConstructor<T>) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse<ResponseType>();
    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode,
        message: 'Success',
        data: plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        }),
      })),
    );
  }
}

/**
 * Handles paginated responses: { data: T[], total, page, limit, totalPages }.
 * Transforms each item in `data` through the DTO while preserving pagination metadata.
 */
@Injectable()
export class PaginatedTransformInterceptor<T> implements NestInterceptor {
  constructor(private readonly dto: ClassConstructor<T>) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown>> {
    const response = context.switchToHttp().getResponse<ResponseType>();
    return next.handle().pipe(
      map((paginated) => ({
        statusCode: response.statusCode,
        message: 'Success',
        data: {
          ...paginated,
          data: plainToInstance(this.dto, paginated.data as unknown[], {
            excludeExtraneousValues: true,
          }),
        },
      })),
    );
  }
}
