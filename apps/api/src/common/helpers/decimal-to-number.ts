import { Prisma } from '@prisma/client';

export type DecimalToNumber<T> = T extends Prisma.Decimal
  ? number
  : T extends Date
    ? Date
    : T extends Function
      ? T
      : T extends Array<infer U>
        ? DecimalToNumber<U>[]
        : T extends object
          ? { [K in keyof T]: DecimalToNumber<T[K]> }
          : T;
