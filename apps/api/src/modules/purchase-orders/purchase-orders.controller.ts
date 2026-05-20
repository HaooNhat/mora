import { GetUser } from '@mora/api/common/decorators/get-user.decorator';
import {
  PaginatedSerialize,
  Serialize,
} from '@mora/api/common/decorators/serialize.decorator';
import { PageQueryDto } from '@mora/api/common/dto/page-query.dto';
import { JwtAuthGuard } from '@mora/api/common/guards/jwt.guard';
import {
  Body,
  Controller,
  Get,
  Param,
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
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderResponseDto } from './dto/response-dto/purchase-order.response.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Post()
  @Serialize(PurchaseOrderResponseDto)
  @ApiOperation({
    summary: 'Create a purchase order from an approved requisition',
  })
  @ApiResponse({
    status: 201,
    description: 'Purchase order created',
    type: PurchaseOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Requisition is not APPROVED' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — buyer roles required',
  })
  async create(
    @Body() dto: CreatePurchaseOrderDto,
    @GetUser('id') userId: string,
  ) {
    const actor = await this.organizationService.resolveActor(
      userId,
      dto.buyerOrgId,
    );
    return this.purchaseOrdersService.create(dto, actor);
  }

  @Get()
  @PaginatedSerialize(PurchaseOrderResponseDto)
  @ApiOperation({
    summary: 'List purchase orders for an organization (buyer or supplier)',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Buyer or supplier organization ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of purchase orders',
  })
  @ApiResponse({ status: 403, description: 'Not a member of the organization' })
  async findAll(
    @Query('orgId') orgId: string,
    @Query() pageQuery: PageQueryDto,
    @GetUser('id') userId: string,
  ) {
    await this.organizationService.resolveActor(userId, orgId);
    return this.purchaseOrdersService.findAll(
      orgId,
      pageQuery.page ?? 1,
      pageQuery.limit ?? 20,
    );
  }

  @Get(':id')
  @Serialize(PurchaseOrderResponseDto)
  @ApiOperation({ summary: 'Get a single purchase order' })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Buyer or supplier organization ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase order found',
    type: PurchaseOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async findOne(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @GetUser('id') userId: string,
  ) {
    await this.organizationService.resolveActor(userId, orgId);
    return this.purchaseOrdersService.findOne(id, orgId);
  }

  // ---------------------------------------------------------------------------
  // Transitions
  // ---------------------------------------------------------------------------

  @Post(':id/send')
  @Serialize(PurchaseOrderResponseDto)
  @ApiOperation({ summary: 'Send PO to supplier — SUBMITTED → SENT' })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Buyer organization ID',
  })
  @ApiResponse({
    status: 201,
    description: 'PO sent',
    type: PurchaseOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({ status: 403, description: 'Buyer role required' })
  async send(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @GetUser('id') userId: string,
  ) {
    const actor = await this.organizationService.resolveActor(userId, orgId);
    return this.purchaseOrdersService.send(id, actor);
  }

  @Post(':id/confirm')
  @Serialize(PurchaseOrderResponseDto)
  @ApiOperation({
    summary: 'Confirm PO receipt by supplier — SENT → CONFIRMED',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: "Supplier organization ID — must match the PO's supplierOrgId",
  })
  @ApiResponse({
    status: 201,
    description: 'PO confirmed',
    type: PurchaseOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({
    status: 403,
    description: 'Supplier role required or org mismatch',
  })
  async confirm(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @GetUser('id') userId: string,
  ) {
    // actor.orgId === orgId, which must match po.supplierOrgId — enforced in state machine guard
    const actor = await this.organizationService.resolveActor(userId, orgId);
    return this.purchaseOrdersService.confirm(id, actor);
  }

  @Post(':id/cancel')
  @Serialize(PurchaseOrderResponseDto)
  @ApiOperation({
    summary: 'Cancel a PO — only allowed before goods are received',
  })
  @ApiQuery({
    name: 'orgId',
    required: true,
    description: 'Buyer organization ID',
  })
  @ApiResponse({
    status: 201,
    description: 'PO cancelled',
    type: PurchaseOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'PO is past the cancellable state' })
  @ApiResponse({ status: 403, description: 'Buyer role required' })
  async cancel(
    @Param('id') id: string,
    @Query('orgId') orgId: string,
    @GetUser('id') userId: string,
  ) {
    const actor = await this.organizationService.resolveActor(userId, orgId);
    return this.purchaseOrdersService.cancel(id, actor);
  }
}
