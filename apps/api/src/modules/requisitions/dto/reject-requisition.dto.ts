import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectRequisitionDto {
  @ApiProperty({ example: 'Budget exceeded for this quarter' })
  @IsString()
  @IsNotEmpty()
  rejectedReason: string;
}
