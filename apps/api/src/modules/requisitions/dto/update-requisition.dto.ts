import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateRequisitionItemDto } from './create-requisition.dto';

export class UpdateRequisitionDto {
  @ApiProperty({ example: 'Updated Equipment Purchase', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: () => [CreateRequisitionItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRequisitionItemDto)
  items?: CreateRequisitionItemDto[];
}
