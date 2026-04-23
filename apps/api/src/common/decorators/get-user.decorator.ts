import { JwtExtracted } from '@mora/api/modules/auth/interfaces/jwt.types';
import { RequestWithUser } from '@mora/api/modules/auth/interfaces/request.interface';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (
    data: keyof JwtExtracted | undefined,
    ctx: ExecutionContext,
  ): JwtExtracted | string => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
