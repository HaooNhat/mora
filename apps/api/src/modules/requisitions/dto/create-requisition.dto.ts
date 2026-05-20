import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
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
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency must be a 3-letter ISO 4217 code',
  })
  currency?: string;

  @ApiProperty({ type: () => [CreateRequisitionItemDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateRequisitionItemDto)
  items: CreateRequisitionItemDto[];
}
