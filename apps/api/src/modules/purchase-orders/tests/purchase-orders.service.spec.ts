import { Actor } from '@mora/api/common/state-machine/types';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  OrganizationRole,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  RequisitionStatus,
} from '@prisma/client';
import { RequisitionsService } from '../../requisitions/requisitions.service';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import {
  PurchaseOrdersRepository,
  PurchaseOrderWithItems,
} from '../purchase-orders.repository';
import { PurchaseOrdersService } from '../purchase-orders.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePO(
  overrides: Partial<PurchaseOrder & { items: PurchaseOrderItem[] }> = {},
): PurchaseOrderWithItems {
  return {
    id: 'po-1',
    requisitionId: 'req-1',
    buyerOrgId: 'org-buyer',
    supplierOrgId: 'org-supplier',
    status: PurchaseOrderStatus.SUBMITTED,
    orderDate: new Date(),
    expectedDate: null,
    subtotal: 1000 as any,
    shippingAmount: 0 as any,
    totalAmount: 1000 as any,
    currency: 'USD',
    createdBy: 'user-1',
    approvedBy: null,
    approvedAt: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  };
}

// Actor on buyer side by default
function makeActor(
  role: OrganizationRole = OrganizationRole.FINANCE,
  orgId = 'org-buyer',
  id = 'user-1',
): Actor {
  return { id, role, orgId };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRepo = {
  create: jest.fn(),
  findMany: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  updateStatus: jest.fn(),
  sumReceivedQuantity: jest.fn(),
} as unknown as jest.Mocked<PurchaseOrdersRepository>;

const mockRequisitionsService = {
  findOne: jest.fn(),
  markOrdered: jest.fn(),
} as unknown as jest.Mocked<RequisitionsService>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        { provide: PurchaseOrdersRepository, useValue: mockRepo },
        { provide: RequisitionsService, useValue: mockRequisitionsService },
      ],
    }).compile();

    service = module.get(PurchaseOrdersService);
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreatePurchaseOrderDto = {
      requisitionId: 'req-1',
      buyerOrgId: 'org-buyer',
      supplierOrgId: 'org-supplier',
      currency: 'USD',
      shippingAmount: 50,
      items: [
        { description: 'Laptop', quantity: 2, unitPrice: 500 },
        { description: 'Mouse', quantity: 5, unitPrice: 20 },
      ],
    };

    // What we're verifying: role guard runs BEFORE any DB call
    it('throws ForbiddenException when actor role is not BUYER (e.g. STAFF)', async () => {
      const actor = makeActor(OrganizationRole.STAFF);

      await expect(service.create(dto, actor)).rejects.toThrow(
        ForbiddenException,
      );
      expect(mockRequisitionsService.findOne).not.toHaveBeenCalled();
    });

    // What we're verifying: the PR must be APPROVED before a PO can be created
    it('throws BadRequestException when the referenced PR is not APPROVED', async () => {
      const actor = makeActor(OrganizationRole.FINANCE);
      mockRequisitionsService.findOne!.mockResolvedValue({
        status: RequisitionStatus.SUBMITTED,
        currency: 'USD',
      } as any);

      await expect(service.create(dto, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    // What we're verifying: subtotal and total are calculated from items + shipping
    it('calculates subtotal and totalAmount correctly and persists the PO', async () => {
      const actor = makeActor(OrganizationRole.FINANCE);
      mockRequisitionsService.findOne!.mockResolvedValue({
        status: RequisitionStatus.APPROVED,
        currency: 'USD',
      } as any);
      mockRepo.create!.mockResolvedValue(makePO());
      mockRequisitionsService.markOrdered!.mockResolvedValue(undefined as any);

      await service.create(dto, actor);

      // 2*500 + 5*20 = 1100 (subtotal) + 50 (shipping) = 1150
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 1100,
          shippingAmount: 50,
          totalAmount: 1150,
          status: PurchaseOrderStatus.SUBMITTED,
        }),
      );
    });

    // What we're verifying: markOrdered is always called after PO is saved —
    // domain rule: a PR can only be ordered once.
    it('calls markOrdered on the PR after creating the PO', async () => {
      const actor = makeActor(OrganizationRole.FINANCE);
      mockRequisitionsService.findOne!.mockResolvedValue({
        status: RequisitionStatus.APPROVED,
        currency: 'USD',
      } as any);
      mockRepo.create!.mockResolvedValue(makePO());
      mockRequisitionsService.markOrdered!.mockResolvedValue(undefined as any);

      await service.create(dto, actor);

      expect(mockRequisitionsService.markOrdered).toHaveBeenCalledWith(
        dto.requisitionId,
        actor,
      );
    });

    // What we're verifying: currency falls back to the PR's currency when not in dto
    it('inherits currency from the PR when not provided in the DTO', async () => {
      const actor = makeActor(OrganizationRole.OWNER);
      const dtoWithoutCurrency = { ...dto, currency: undefined };
      mockRequisitionsService.findOne!.mockResolvedValue({
        status: RequisitionStatus.APPROVED,
        currency: 'EUR', // PR's currency
      } as any);
      mockRepo.create!.mockResolvedValue(makePO({ currency: 'EUR' }));
      mockRequisitionsService.markOrdered!.mockResolvedValue(undefined as any);

      await service.create(dtoWithoutCurrency, actor);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ currency: 'EUR' }),
      );
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the PO when it exists and the org is a party', async () => {
      const po = makePO();
      mockRepo.findOne!.mockResolvedValue(po);

      const result = await service.findOne('po-1', 'org-buyer');
      expect(result).toEqual(po);
    });

    // What we're verifying: NotFoundException hides PO existence from unrelated orgs
    it('throws NotFoundException when repo returns null (PO not found or wrong org)', async () => {
      mockRepo.findOne!.mockResolvedValue(null);

      await expect(service.findOne('ghost', 'org-buyer')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── send (SUBMITTED → SENT) ───────────────────────────────────────────────

  describe('send', () => {
    it('sends the PO for a BUYER role (FINANCE)', async () => {
      const actor = makeActor(OrganizationRole.FINANCE);
      mockRepo.findOne!.mockResolvedValue(makePO({ status: PurchaseOrderStatus.SUBMITTED }));
      mockRepo.updateStatus!.mockResolvedValue(makePO({ status: PurchaseOrderStatus.SENT }));

      const result = await service.send('po-1', actor);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'po-1',
        PurchaseOrderStatus.SENT,
      );
      expect(result.status).toBe(PurchaseOrderStatus.SENT);
    });

    // What we're verifying: state machine guard throws ForbiddenTransitionException
    // which the service wraps into ForbiddenException
    it('throws ForbiddenException when a non-buyer role (MANAGER) tries to send', async () => {
      const actor = makeActor(OrganizationRole.MANAGER);
      mockRepo.findOne!.mockResolvedValue(makePO({ status: PurchaseOrderStatus.SUBMITTED }));

      await expect(service.send('po-1', actor)).rejects.toThrow(
        ForbiddenException,
      );
    });

    // What we're verifying: state machine throws InvalidTransitionException for
    // wrong source state, which the service wraps into BadRequestException
    it('throws BadRequestException when PO is already SENT (invalid transition)', async () => {
      const actor = makeActor(OrganizationRole.FINANCE);
      mockRepo.findOne!.mockResolvedValue(makePO({ status: PurchaseOrderStatus.SENT }));

      await expect(service.send('po-1', actor)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── confirm (SENT → CONFIRMED) ────────────────────────────────────────────

  describe('confirm', () => {
    // What we're verifying: supplier org identity check in the guard
    it('confirms the PO when a supplier FINANCE role calls confirm', async () => {
      const actor = makeActor(OrganizationRole.FINANCE, 'org-supplier');
      mockRepo.findOne!.mockResolvedValue(makePO({ status: PurchaseOrderStatus.SENT }));
      mockRepo.updateStatus!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.CONFIRMED }),
      );

      const result = await service.confirm('po-1', actor);
      expect(result.status).toBe(PurchaseOrderStatus.CONFIRMED);
    });

    // What we're verifying: a buyer actor cannot confirm even if they have a valid role,
    // because the guard checks actor.orgId === doc.supplierOrgId
    it('throws ForbiddenException when the buyer tries to confirm (wrong org)', async () => {
      const actor = makeActor(OrganizationRole.FINANCE, 'org-buyer');
      mockRepo.findOne!.mockResolvedValue(makePO({ status: PurchaseOrderStatus.SENT }));

      await expect(service.confirm('po-1', actor)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ── cancel ────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('cancels a SUBMITTED PO for a BUYER role', async () => {
      const actor = makeActor(OrganizationRole.OWNER);
      mockRepo.findOne!.mockResolvedValue(makePO({ status: PurchaseOrderStatus.SUBMITTED }));
      mockRepo.updateStatus!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.CANCELLED }),
      );

      const result = await service.cancel('po-1', actor);
      expect(result.status).toBe(PurchaseOrderStatus.CANCELLED);
    });

    it('throws BadRequestException when PO is already CANCELLED', async () => {
      const actor = makeActor(OrganizationRole.OWNER);
      mockRepo.findOne!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.CANCELLED }),
      );

      await expect(service.cancel('po-1', actor)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── recalculateReceiptStatus ──────────────────────────────────────────────

  describe('recalculateReceiptStatus', () => {
    it('throws NotFoundException when the PO does not exist', async () => {
      mockRepo.findById!.mockResolvedValue(null);

      await expect(service.recalculateReceiptStatus('ghost')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when PO status is SUBMITTED (not receipted state)', async () => {
      mockRepo.findById!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.SUBMITTED }),
      );

      await expect(service.recalculateReceiptStatus('po-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    // What we're verifying: when 0 goods received, return the PO as-is without writing
    it('returns PO unchanged when totalReceived is 0 (no goods received yet)', async () => {
      const po = makePO({ status: PurchaseOrderStatus.CONFIRMED });
      mockRepo.findById!.mockResolvedValue(po);
      mockRepo.sumReceivedQuantity!.mockResolvedValue({
        totalOrdered: 10,
        totalReceived: 0,
      });

      const result = await service.recalculateReceiptStatus('po-1');

      expect(result).toEqual(po);
      expect(mockRepo.updateStatus).not.toHaveBeenCalled(); // no write
    });

    // What we're verifying: partial receipt → PARTIALLY_RECEIVED
    it('transitions to PARTIALLY_RECEIVED when some goods received', async () => {
      mockRepo.findById!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.CONFIRMED }),
      );
      mockRepo.sumReceivedQuantity!.mockResolvedValue({
        totalOrdered: 10,
        totalReceived: 5,
      });
      mockRepo.updateStatus!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.PARTIALLY_RECEIVED }),
      );

      const result = await service.recalculateReceiptStatus('po-1');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'po-1',
        PurchaseOrderStatus.PARTIALLY_RECEIVED,
      );
      expect(result.status).toBe(PurchaseOrderStatus.PARTIALLY_RECEIVED);
    });

    // What we're verifying: full receipt → RECEIVED
    it('transitions to RECEIVED when all goods received', async () => {
      mockRepo.findById!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.CONFIRMED }),
      );
      mockRepo.sumReceivedQuantity!.mockResolvedValue({
        totalOrdered: 10,
        totalReceived: 10,
      });
      mockRepo.updateStatus!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.RECEIVED }),
      );

      const result = await service.recalculateReceiptStatus('po-1');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'po-1',
        PurchaseOrderStatus.RECEIVED,
      );
      expect(result.status).toBe(PurchaseOrderStatus.RECEIVED);
    });

    // What we're verifying: idempotent — if already correct status, skip the DB write
    it('skips the DB write when status would not change', async () => {
      mockRepo.findById!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.PARTIALLY_RECEIVED }),
      );
      mockRepo.sumReceivedQuantity!.mockResolvedValue({
        totalOrdered: 10,
        totalReceived: 5,
      });

      await service.recalculateReceiptStatus('po-1');

      expect(mockRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  // ── markInvoiced ──────────────────────────────────────────────────────────

  describe('markInvoiced', () => {
    it('throws NotFoundException when PO does not exist', async () => {
      mockRepo.findById!.mockResolvedValue(null);
      await expect(service.markInvoiced('ghost')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when PO is not RECEIVED', async () => {
      mockRepo.findById!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.CONFIRMED }),
      );
      await expect(service.markInvoiced('po-1')).rejects.toThrow(BadRequestException);
    });

    it('moves PO to INVOICED when it is RECEIVED', async () => {
      mockRepo.findById!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.RECEIVED }),
      );
      mockRepo.updateStatus!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.INVOICED }),
      );

      const result = await service.markInvoiced('po-1');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'po-1',
        PurchaseOrderStatus.INVOICED,
      );
      expect(result.status).toBe(PurchaseOrderStatus.INVOICED);
    });
  });

  // ── markClosed ────────────────────────────────────────────────────────────

  describe('markClosed', () => {
    it('throws NotFoundException when PO does not exist', async () => {
      mockRepo.findById!.mockResolvedValue(null);
      await expect(service.markClosed('ghost')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when PO is not INVOICED', async () => {
      mockRepo.findById!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.RECEIVED }),
      );
      await expect(service.markClosed('po-1')).rejects.toThrow(BadRequestException);
    });

    it('moves PO to CLOSED when it is INVOICED', async () => {
      mockRepo.findById!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.INVOICED }),
      );
      mockRepo.updateStatus!.mockResolvedValue(
        makePO({ status: PurchaseOrderStatus.CLOSED }),
      );

      const result = await service.markClosed('po-1');

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        'po-1',
        PurchaseOrderStatus.CLOSED,
      );
      expect(result.status).toBe(PurchaseOrderStatus.CLOSED);
    });
  });
});
