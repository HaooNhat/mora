import { ApiProperty } from '@nestjs/swagger';
import { OrganizationType } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corp', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2, { message: 'Organization name must be at least 2 characters' })
  @MaxLength(100)
  name: string;

  @ApiProperty({
    enum: OrganizationType,
    example: OrganizationType.BUYER,
    description: 'BUYER, SUPPLIER, or BOTH',
  })
  @IsEnum(OrganizationType, {
    message: 'Type must be BUYER, SUPPLIER, or BOTH',
  })
  type: OrganizationType;

  @ApiProperty({ example: 'Acme Corporation Ltd.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;
}
