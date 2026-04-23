import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    path: string;
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    // Log error
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(errorResponse.statusCode).json(errorResponse.body);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): { statusCode: number; body: ErrorResponse } {
    const timestamp = new Date().toISOString();
    const path = request.url;

    // Handle HTTP exceptions (NestJS built-in)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      return {
        statusCode: status,
        body: {
          success: false,
          error: {
            code: this.getErrorCode(status),
            message:
              typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message || exception.message,
            details:
              typeof exceptionResponse === 'object'
                ? exceptionResponse
                : undefined,
            timestamp,
            path,
          },
        },
      };
    }

    // Handle Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaError(exception, timestamp, path);
    }

    // Handle unknown errors
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          timestamp,
          path,
        },
      },
    };
  }

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
    timestamp: string,
    path: string,
  ): { statusCode: number; body: ErrorResponse } {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return {
          statusCode: HttpStatus.CONFLICT,
          body: {
            success: false,
            error: {
              code: 'UNIQUE_CONSTRAINT_VIOLATION',
              message: 'A record with this value already exists',
              details: error.meta,
              timestamp,
              path,
            },
          },
        };

      case 'P2025': // Record not found
        return {
          statusCode: HttpStatus.NOT_FOUND,
          body: {
            success: false,
            error: {
              code: 'RECORD_NOT_FOUND',
              message: 'The requested record was not found',
              timestamp,
              path,
            },
          },
        };

      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          body: {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'A database error occurred',
              details: error.meta,
              timestamp,
              path,
            },
          },
        };
    }
  }

  private getErrorCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };

    return codes[status] || 'UNKNOWN_ERROR';
  }
}
