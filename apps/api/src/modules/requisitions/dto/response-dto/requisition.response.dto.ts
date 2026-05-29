import { RequisitionStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class RequisitionItemResponseDto {
  @ApiProperty({ example: 'clx1234abcd' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'MacBook Pro 14"' })
  @Expose()
  description: string;

  @ApiProperty({ example: 2 })
  @Expose()
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 1999.99 })
  @Expose()
  @Type(() => String)
  unitPrice: string;

  @ApiProperty({ example: 3999.98 })
  @Expose()
  @Type(() => String)
  totalPrice: string;

  @ApiProperty({ example: 'USD' })
  @Expose()
  currency: string;

  @ApiProperty({ example: 'Needed for the design team', nullable: true })
  @Expose()
  notes: string | null;
}

export class RequisitionResponseDto {
  @ApiProperty({ example: 'clx1234abcd' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Q2 Equipment Purchase' })
  @Expose()
  title: string;

  @ApiProperty({ example: 'Laptops for the new design hires', nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty({
    enum: RequisitionStatus,
    example: RequisitionStatus.SUBMITTED,
  })
  @Expose()
  status: RequisitionStatus;

  @ApiProperty({ example: 3999.98 })
  @Expose()
  @Type(() => Number)
  totalAmount: number;

  @ApiProperty({ example: 'USD' })
  @Expose()
  currency: string;

  @ApiProperty({ example: 'user-uuid' })
  @Expose()
  requestedBy: string;

  @ApiProperty({ example: 'approver-uuid', nullable: true })
  @Expose()
  approvedBy: string | null;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z', nullable: true })
  @Expose()
  approvedAt: Date | null;

  @ApiProperty({ example: 'Budget exceeded for this quarter', nullable: true })
  @Expose()
  rejectedReason: string | null;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ type: () => [RequisitionItemResponseDto] })
  @Expose()
  @Type(() => RequisitionItemResponseDto)
  items: RequisitionItemResponseDto[];
}
