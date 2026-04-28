import { ApiProperty } from '@nestjs/swagger';
import { OrganizationRole, OrganizationType } from '@prisma/client';
import { Expose } from 'class-transformer';

export class OrganizationResponseDto {
  @ApiProperty({ example: 'org-uuid' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Acme Corp' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Acme Corporation Ltd.', nullable: true })
  @Expose()
  legalName: string | null;

  @ApiProperty({ enum: OrganizationType, example: OrganizationType.BUYER })
  @Expose()
  type: OrganizationType;

  @ApiProperty({ example: 'https://example.com/logo.png', nullable: true })
  @Expose()
  logo: string | null;

  @ApiProperty({ enum: OrganizationRole, example: OrganizationRole.OWNER })
  @Expose()
  role: OrganizationRole;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;
}
