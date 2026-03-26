// import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// import { User } from '@prisma/client';
//
// export const GetUser = createParamDecorator(
//   (data: keyof User | undefined, ctx: ExecutionContext): User | null => {
//     const request = ctx.switchToHttp().getRequest();
//     const user = request.user;
//
//     // If a specific field is requested, return just that field
//     return data ? user?.[data] : user;
//   },
// );
