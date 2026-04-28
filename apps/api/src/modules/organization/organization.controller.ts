import { GetUser } from '@mora/api/common/decorators/get-user.decorator';
import { Serialize } from '@mora/api/common/decorators/serialize.decorator';
import { JwtAuthGuard } from '@mora/api/common/guards/jwt.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationResponseDto } from './dto/response-dto/organization.response.dto';
import { OrganizationService } from './organization.service';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('me')
  @Serialize(OrganizationResponseDto)
  @ApiOperation({
    summary: 'List all organizations the current user belongs to',
  })
  @ApiResponse({
    status: 200,
    description: 'List of organizations with the user role in each',
    type: [OrganizationResponseDto],
  })
  async getMyOrganizations(
    @GetUser('id') userId: string,
  ): Promise<OrganizationResponseDto[]> {
    return this.organizationService.getMyOrganizations(userId) as any;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Serialize(OrganizationResponseDto)
  @ApiOperation({
    summary: 'Create a new organization — current user becomes OWNER',
  })
  @ApiResponse({
    status: 201,
    description: 'Organization created',
    type: OrganizationResponseDto,
  })
  async create(
    @Body() dto: CreateOrganizationDto,
    @GetUser('id') userId: string,
  ): Promise<OrganizationResponseDto> {
    return this.organizationService.createOrganization(dto, userId) as any;
  }
}
