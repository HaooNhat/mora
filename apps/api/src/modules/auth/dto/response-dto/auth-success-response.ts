import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthSuccessResponseDto {
  @ApiProperty({ example: true })
  @Expose()
  success: boolean;

  @ApiProperty({
    example: 'Operation completed successfully.',
    required: false,
  })
  @Expose()
  message?: string;
}
