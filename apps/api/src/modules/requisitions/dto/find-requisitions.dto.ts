import { PageQueryDto } from '@mora/api/common/dto/page-query.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class FindRequisitionsDto extends PageQueryDto {
  @ApiPropertyOptional({ description: 'Organisation ID' })
  @IsUUID()
  @IsString()
  orgId: string;
}
