import { UseInterceptors, applyDecorators } from '@nestjs/common';
import { ClassConstructor } from 'class-transformer';
import {
  PaginatedTransformInterceptor,
  TransformInterceptor,
} from '../interceptors/transform.interceptor';

export const Serialize = <T>(dto: ClassConstructor<T>) =>
  applyDecorators(UseInterceptors(new TransformInterceptor(dto)));

export const PaginatedSerialize = <T>(dto: ClassConstructor<T>) =>
  applyDecorators(UseInterceptors(new PaginatedTransformInterceptor(dto)));
