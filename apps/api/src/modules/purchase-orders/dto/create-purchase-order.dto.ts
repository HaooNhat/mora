import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePurchaseOrderItemDto {
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
}

export class CreatePurchaseOrderDto {
  @ApiProperty({
    example: 'pr-uuid',
    description: 'Must reference an APPROVED purchase requisition',
  })
  @IsString()
  @IsNotEmpty()
  requisitionId: string;

  @ApiProperty({
    example: 'buyer-org-uuid',
    description: 'Buyer organization — used for actor resolution',
  })
  @IsString()
  @IsNotEmpty()
  buyerOrgId: string;

  @ApiProperty({ example: 'supplier-org-uuid' })
  @IsString()
  @IsNotEmpty()
  supplierOrgId: string;

  @ApiProperty({
    example: '2026-05-01',
    required: false,
    description: 'Expected delivery date (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  expectedDate?: string;

  @ApiProperty({ example: 50.0, required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingAmount?: number;

  @ApiProperty({ example: 'USD', required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: 'Currency must be a 3-letter ISO 4217 code',
  })
  currency?: string;

  @ApiProperty({
    example: 'Urgent — please deliver by end of month',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: () => [CreatePurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}
