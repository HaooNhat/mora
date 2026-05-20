import { GetUser } from '@mora/api/common/decorators/get-user.decorator';
import {
  PaginatedSerialize,
  Serialize,
} from '@mora/api/common/decorators/serialize.decorator';
import { JwtAuthGuard } from '@mora/api/common/guards/jwt.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationService } from '../organization/organization.service';
import { CreateRequisitionDto } from './dto/create-requisition.dto';
import { FindRequisitionsDto } from './dto/find-requisitions.dto';
import { RejectRequisitionDto } from './dto/reject-requisition.dto';
import { RequisitionResponseDto } from './dto/response-dto/requisition.response.dto';
import { UpdateRequisitionDto } from './dto/update-requisition.dto';
import { RequisitionsService } from './requisitions.service';

@ApiTags('requisitions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('requisitions')
export class RequisitionsController {
  constructor(
    private readonly requisitionsService: RequisitionsService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Post()
  @Serialize(RequisitionResponseDto)
  @ApiOperation({ summary: 'Create a new purchase requisition' })
  @ApiResponse({
    status: 201,
    description: 'Requisition created',
    type: RequisitionResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Not a member of the organization' })
  async create(
    @Body() dto: CreateRequisitionDto,
    @GetUser('id') userId: string,
  ) {
    const actor = await this.organizationService.resolveActor(
      userId,
      dto.orgId,
    );
    return this.requisitionsService.create(dto, actor);
  }

  @Get()
  @PaginatedSerialize(RequisitionResponseDto)
  @ApiOperation({ summary: 'List all requisitions for an organization' })
  @ApiQuery({ name: 'orgId', required: true, description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Paginated list of requisitions' })
  @ApiResponse({ status: 403, description: 'Not a member of the organization' })
  async findAll(
    @Query() findAllQuery: FindRequisitionsDto,
    @GetUser('id') userId: string,
  ) {
    const { orgId, page, limit } = findAllQuery;
    await this.organizationService.resolveActor(userId, orgId);

    return this.requisitionsService.findAll(orgId, page ?? 1, limit ?? 20);
  }

  @Get(':id')
  @Serialize(RequisitionResponseDto)
  @ApiOperation({ summary: 'Get a single requisition by ID' })
  @ApiQuery({ name: 'orgId', required: true, description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Requisition found',
    type: RequisitionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Requisition not found' })
  async findOne(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @GetUser('id') userId: string,
  ) {
    await this.organizationService.resolveActor(userId, orgId);
    return this.requisitionsService.findOne(id, orgId);
  }

  @Patch(':id')
  @Serialize(RequisitionResponseDto)
  @ApiOperation({ summary: 'Update a SUBMITTED requisition' })
  @ApiQuery({ name: 'orgId', required: true, description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Requisition updated',
    type: RequisitionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Requisition is not in SUBMITTED status',
  })
  @ApiResponse({ status: 403, description: 'Only the requester can edit' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRequisitionDto,
    @Query('orgId') orgId: string,
    @GetUser('id') userId: string,
  ) {
    const actor = await this.organizationService.resolveActor(userId, orgId);
    return this.requisitionsService.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a SUBMITTED requisition' })
  @ApiQuery({ name: 'orgId', required: true, description: 'Organization ID' })
  @ApiResponse({ status: 204, description: 'Requisition deleted' })
  @ApiResponse({
    status: 400,
    description: 'Requisition is not in SUBMITTED status',
  })
  @ApiResponse({ status: 403, description: 'Only the requester can delete' })
  async remove(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @GetUser('id') userId: string,
  ) {
    const actor = await this.organizationService.resolveActor(userId, orgId);
    return this.requisitionsService.remove(id, actor);
  }

  // ---------------------------------------------------------------------------
  // Transition endpoints
  // ---------------------------------------------------------------------------

  @Post(':id/approve')
  @Serialize(RequisitionResponseDto)
  @ApiOperation({ summary: 'Approve a submitted requisition' })
  @ApiQuery({ name: 'orgId', required: true, description: 'Organization ID' })
  @ApiResponse({
    status: 201,
    description: 'Requisition approved',
    type: RequisitionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role or self-approval not allowed',
  })
  async approve(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @GetUser('id') userId: string,
  ) {
    const actor = await this.organizationService.resolveActor(userId, orgId);
    return this.requisitionsService.approve(id, actor);
  }

  @Post(':id/reject')
  @Serialize(RequisitionResponseDto)
  @ApiOperation({ summary: 'Reject a submitted requisition' })
  @ApiQuery({ name: 'orgId', required: true, description: 'Organization ID' })
  @ApiResponse({
    status: 201,
    description: 'Requisition rejected',
    type: RequisitionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transition or missing rejection reason',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role or self-rejection not allowed',
  })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectRequisitionDto,
    @Query('orgId') orgId: string,
    @GetUser('id') userId: string,
  ) {
    const actor = await this.organizationService.resolveActor(userId, orgId);
    return this.requisitionsService.reject(id, dto.rejectedReason, actor);
  }
}
