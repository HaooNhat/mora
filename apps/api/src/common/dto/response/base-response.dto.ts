import { ApiProperty } from '@nestjs/swagger';

export class BaseResponseDto<T = unknown> {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ required: false })
  message?: string;

  @ApiProperty({ required: false })
  data?: T;

  @ApiProperty({ required: false })
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
