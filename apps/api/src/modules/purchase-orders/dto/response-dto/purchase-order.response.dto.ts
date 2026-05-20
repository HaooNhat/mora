import { PurchaseOrderStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';

export class PurchaseOrderItemResponseDto {
  @ApiProperty({ example: 'clx1234abcd' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'MacBook Pro 14"' })
  @Expose()
  description: string;

  @ApiProperty({ example: 2 })
  @Expose()
  @Transform(({ value }) => Number(value))
  quantity: number;

  @ApiProperty({ example: 1999.99 })
  @Expose()
  @Transform(({ value }) => String(value))
  unitPrice: string;

  @ApiProperty({ example: 3999.98 })
  @Expose()
  @Transform(({ value }) => String(value))
  totalPrice: string;

  @ApiProperty({ example: 'USD' })
  @Expose()
  currency: string;
}

export class PurchaseOrderResponseDto {
  @ApiProperty({ example: 'clx1234abcd' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'pr-uuid', nullable: true })
  @Expose()
  requisitionId: string | null;

  @ApiProperty({ example: 'buyer-org-uuid' })
  @Expose()
  buyerOrgId: string;

  @ApiProperty({ example: 'supplier-org-uuid' })
  @Expose()
  supplierOrgId: string;

  @ApiProperty({
    enum: PurchaseOrderStatus,
    example: PurchaseOrderStatus.SUBMITTED,
  })
  @Expose()
  status: PurchaseOrderStatus;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @Expose()
  orderDate: Date;

  @ApiProperty({ example: '2026-05-01T00:00:00.000Z', nullable: true })
  @Expose()
  expectedDate: Date | null;

  @ApiProperty({ example: 3999.98 })
  @Expose()
  @Transform(({ value }) => Number(value))
  subtotal: number;

  @ApiProperty({ example: 50.0 })
  @Expose()
  @Transform(({ value }) => Number(value))
  shippingAmount: number;

  @ApiProperty({ example: 4049.98 })
  @Expose()
  @Transform(({ value }) => Number(value))
  totalAmount: number;

  @ApiProperty({ example: 'USD' })
  @Expose()
  currency: string;

  @ApiProperty({ example: 'user-uuid' })
  @Expose()
  createdBy: string;

  @ApiProperty({ example: 'approver-uuid', nullable: true })
  @Expose()
  approvedBy: string | null;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z', nullable: true })
  @Expose()
  approvedAt: Date | null;

  @ApiProperty({ example: 'Urgent delivery requested', nullable: true })
  @Expose()
  notes: string | null;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ type: () => [PurchaseOrderItemResponseDto] })
  @Expose()
  @Type(() => PurchaseOrderItemResponseDto)
  items: PurchaseOrderItemResponseDto[];
}
