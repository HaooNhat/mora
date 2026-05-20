import { TracedRequest } from '@mora/api/common/interfaces/traced-request.interface';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

interface ErrorDetail {
  code: string;
  message: string | string[];
  requestId?: string;
  details?: unknown;
  timestamp: string;
  path: string;
}

interface ErrorResponse {
  success: false;
  error: ErrorDetail;
}

interface NormalizedError {
  statusCode: number;
  body: ErrorResponse;

  /** Separated from body — for logging only, never sent to client */
  internalDetail?: unknown;
}

const HTTP_CODE_MAP: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<TracedRequest>();

    const normalized = this.normalize(exception, request);

    const logMeta = {
      requestId: request.requestId,
      method: request.method,
      url: request.url,
      statusCode: normalized.statusCode,

      // Internal detail logged here but never sent to client
      internalDetail: normalized.internalDetail,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    if (normalized.statusCode >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        JSON.stringify(logMeta),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url}`,
        JSON.stringify(logMeta),
      );
    }

    response.status(normalized.statusCode).json(normalized.body);
  }

  private normalize(
    exception: unknown,
    request: TracedRequest,
  ): NormalizedError {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const requestId = request.requestId;

    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception, {
        timestamp,
        path,
        requestId,
      });
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.normalizePrismaKnownError(exception, {
        timestamp,
        path,
        requestId,
      });
    }

    // PrismaClientValidationError = wrong query shape = YOUR bug, always 500
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        body: {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred',
            requestId,
            timestamp,
            path,
          },
        },

        // Full Prisma validation message logged internally only
        internalDetail: exception.message,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          requestId,
          timestamp,
          path,
        },
      },
    };
  }

  private normalizeHttpException(
    exception: HttpException,
    meta: { timestamp: string; path: string; requestId: string },
  ): NormalizedError {
    const status = exception.getStatus();
    const raw = exception.getResponse();

    // NestJS ValidationPipe produces { statusCode, message: string[], error }
    // Extract only the message array — don't re-send statusCode/error noise
    const message =
      typeof raw === 'string'
        ? raw
        : typeof raw === 'object' && 'message' in raw
          ? (raw as { message: string | string[] }).message
          : exception.message;

    // details only for validation arrays — not the whole raw object
    const details =
      typeof raw === 'object' &&
      'message' in raw &&
      Array.isArray((raw as { message: unknown }).message)
        ? (raw as { message: string[] }).message
        : undefined;

    return {
      statusCode: status,
      body: {
        success: false,
        error: {
          code: HTTP_CODE_MAP[status] ?? 'UNKNOWN_ERROR',
          message,
          details,
          requestId: meta.requestId,
          timestamp: meta.timestamp,
          path: meta.path,
        },
      },
    };
  }

  private normalizePrismaKnownError(
    error: Prisma.PrismaClientKnownRequestError,
    meta: { timestamp: string; path: string; requestId: string },
  ): NormalizedError {
    // error.meta contains internal DB details — logged, never sent to client
    const base = { ...meta, internalDetail: error.meta };

    switch (error.code) {
      case 'P2002':
        return {
          statusCode: HttpStatus.CONFLICT,
          body: {
            success: false,
            error: {
              code: 'UNIQUE_CONSTRAINT_VIOLATION',
              message: 'A record with this value already exists',
              ...meta,
            },
          },
          internalDetail: error.meta,
        };

      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          body: {
            success: false,
            error: {
              code: 'RECORD_NOT_FOUND',
              message: 'The requested record was not found',
              ...meta,
            },
          },
        };

      case 'P2003':
      case 'P2014':
        return {
          statusCode: HttpStatus.CONFLICT,
          body: {
            success: false,
            error: {
              code: 'RELATION_VIOLATION',
              message: 'Operation violates a data relationship constraint',
              ...meta,
            },
          },
          internalDetail: error.meta,
        };

      case 'P2000':
        return {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          body: {
            success: false,
            error: {
              code: 'VALUE_TOO_LONG',
              message: 'A provided value exceeds the allowed length',
              ...meta,
            },
          },
          internalDetail: error.meta,
        };

      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          body: {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'An unexpected database error occurred',
              ...meta,
            },
          },
          internalDetail: { prismaCode: error.code, meta: error.meta },
        };
    }
  }
}
