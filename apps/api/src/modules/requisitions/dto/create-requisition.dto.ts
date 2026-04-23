import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateRequisitionItemDto {
  @ApiProperty({ example: 'MacBook Pro 14"' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 1999.99 })
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @ApiProperty({ example: 'Needed for the design team', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRequisitionDto {
  @ApiProperty({ example: 'Q2 Equipment Purchase' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Laptops for new design hires', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'org-uuid' })
  @IsString()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({ example: 'USD', required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ type: () => [CreateRequisitionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRequisitionItemDto)
  items: CreateRequisitionItemDto[];
}
