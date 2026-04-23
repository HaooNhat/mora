import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationRole, PurchaseRequisition, RequisitionStatus } from '@prisma/client';
import { Actor } from '../../../common/state-machine/types';
import { CreateRequisitionDto } from '../dto/create-requisition.dto';
import { UpdateRequisitionDto } from '../dto/update-requisition.dto';
import { RequisitionsRepository, RequisitionWithItems } from '../requisitions.repository';
import { RequisitionsService } from '../requisitions.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequisition(
  overrides: Partial<PurchaseRequisition & { items: any[] }> = {},
): RequisitionWithItems {
  return {
    id: 'req-1',
    title: 'Test Requisition',
    description: null,
    organizationId: 'org-1',
    requestedBy: 'user-1',
    approvedBy: null,
    approvedAt: null,
    rejectedReason: null,
    currency: 'USD',
    totalAmount: 1000 as any,
    status: RequisitionStatus.DRAFT,
    requestedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ...overrides,
  };
}

function makeActor(
  role: OrganizationRole = OrganizationRole.BUYER,
  id = 'user-1',
): Actor {
  return { id, role, orgId: 'org-1' };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRepo = {
  create: jest.fn(),
  findMany: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as unknown as jest.Mocked<RequisitionsRepository>;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RequisitionsService', () => {
  let service: RequisitionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequisitionsService,
        { provide: RequisitionsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(RequisitionsService);
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    const dto: CreateRequisitionDto = {
      title: 'New Equipment',
      orgId: 'org-1',
      currency: 'USD',
      items: [
        { description: 'Laptop', quantity: 2, unitPrice: 1000 },
        { description: 'Mouse', quantity: 5, unitPrice: 20 },
      ],
    };

    it('calculates total amount and persists', async () => {
      const actor = makeActor();
      mockRepo.create!.mockResolvedValue(makeRequisition({ title: dto.title }));

      await service.create(dto, actor);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: dto.title,
          totalAmount: 2100, // 2*1000 + 5*20
          requestedBy: actor.id,
          organizationId: dto.orgId,
          status: RequisitionStatus.DRAFT,
        }),
      );
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns a paginated result', async () => {
      const items = [makeRequisition()];
      mockRepo.findMany!.mockResolvedValue({ data: items, total: 1 });

      const result = await service.findAll('org-1', 1, 20);

      expect(result.data).toEqual(items);
      expect(result.total).toBe(1);
    });
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('returns the requisition when found', async () => {
      const req = makeRequisition();
      mockRepo.findOne!.mockResolvedValue(req);

      const result = await service.findOne('req-1', 'org-1');
      expect(result).toEqual(req);
    });

    it('throws NotFoundException when not found', async () => {
      mockRepo.findOne!.mockResolvedValue(null);

      await expect(service.findOne('ghost', 'org-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    const dto: UpdateRequisitionDto = { title: 'Updated Title' };

    it('updates a DRAFT requisition when requester edits', async () => {
      const actor = makeActor(OrganizationRole.BUYER, 'user-1');
      const req = makeRequisition({ requestedBy: 'user-1', status: RequisitionStatus.DRAFT });
      mockRepo.findOne!.mockResolvedValue(req);
      mockRepo.update!.mockResolvedValue({ ...req, title: 'Updated Title' });

      const result = await service.update('req-1', dto, actor);
      expect(result.title).toBe('Updated Title');
    });

    it('throws BadRequestException when not in DRAFT status', async () => {
      const actor = makeActor(OrganizationRole.BUYER, 'user-1');
      mockRepo.findOne!.mockResolvedValue(
        makeRequisition({ status: RequisitionStatus.SUBMITTED, requestedBy: 'user-1' }),
      );

      await expect(service.update('req-1', dto, actor)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when a different user tries to edit', async () => {
      const actor = makeActor(OrganizationRole.ADMIN, 'user-other');
      mockRepo.findOne!.mockResolvedValue(
        makeRequisition({ status: RequisitionStatus.DRAFT, requestedBy: 'user-1' }),
      );

      await expect(service.update('req-1', dto, actor)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('deletes a DRAFT requisition when the requester calls it', async () => {
      const actor = makeActor(OrganizationRole.BUYER, 'user-1');
      mockRepo.findOne!.mockResolvedValue(
        makeRequisition({ status: RequisitionStatus.DRAFT, requestedBy: 'user-1' }),
      );

      await service.remove('req-1', actor);
      expect(mockRepo.delete).toHaveBeenCalledWith('req-1');
    });

    it('throws BadRequestException when not in DRAFT status', async () => {
      const actor = makeActor(OrganizationRole.BUYER, 'user-1');
      mockRepo.findOne!.mockResolvedValue(
        makeRequisition({ status: RequisitionStatus.APPROVED, requestedBy: 'user-1' }),
      );

      await expect(service.remove('req-1', actor)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when a different user tries to delete', async () => {
      const actor = makeActor(OrganizationRole.ADMIN, 'user-other');
      mockRepo.findOne!.mockResolvedValue(
        makeRequisition({ status: RequisitionStatus.DRAFT, requestedBy: 'user-1' }),
      );

      await expect(service.remove('req-1', actor)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── submit ────────────────────────────────────────────────────────────────

  describe('submit', () => {
    it('transitions DRAFT → SUBMITTED for requester (amount >= $500)', async () => {
      const actor = makeActor(OrganizationRole.VIEWER, 'user-1');
      const req = makeRequisition({
        status: RequisitionStatus.DRAFT,
        requestedBy: 'user-1',
        totalAmount: 1000 as any,
      });
      mockRepo.findOne!.mockResolvedValue(req);
      mockRepo.update!.mockResolvedValue({ ...req, status: RequisitionStatus.SUBMITTED });

      const result = await service.submit('req-1', actor);
      expect(mockRepo.update).toHaveBeenCalledWith(
        'req-1',
        expect.objectContaining({ status: RequisitionStatus.SUBMITTED }),
      );
    });

    it('auto-approves when total amount is below $500', async () => {
      const actor = makeActor(OrganizationRole.VIEWER, 'user-1');
      const req = makeRequisition({
        status: RequisitionStatus.DRAFT,
        requestedBy: 'user-1',
        totalAmount: 100 as any,
      });
      mockRepo.findOne!.mockResolvedValue(req);
      mockRepo.update!.mockResolvedValue({ ...req, status: RequisitionStatus.APPROVED });

      await service.submit('req-1', actor);
      expect(mockRepo.update).toHaveBeenCalledWith(
        'req-1',
        expect.objectContaining({ status: RequisitionStatus.APPROVED }),
      );
    });

    it('throws ForbiddenException when another user submits', async () => {
      const actor = makeActor(OrganizationRole.ADMIN, 'user-other');
      mockRepo.findOne!.mockResolvedValue(
        makeRequisition({ status: RequisitionStatus.DRAFT, requestedBy: 'user-1' }),
      );

      await expect(service.submit('req-1', actor)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── approve ───────────────────────────────────────────────────────────────

  describe('approve', () => {
    it('transitions SUBMITTED → APPROVED for an approver', async () => {
      const actor = makeActor(OrganizationRole.APPROVER, 'user-approver');
      const req = makeRequisition({
        status: RequisitionStatus.SUBMITTED,
        requestedBy: 'user-1',
        totalAmount: 1000 as any,
      });
      mockRepo.findOne!.mockResolvedValue(req);
      mockRepo.update!.mockResolvedValue({ ...req, status: RequisitionStatus.APPROVED });

      const result = await service.approve('req-1', actor);
      expect(mockRepo.update).toHaveBeenCalledWith(
        'req-1',
        expect.objectContaining({
          status: RequisitionStatus.APPROVED,
          approvedBy: actor.id,
        }),
      );
    });

    it('throws ForbiddenException when requester self-approves', async () => {
      const actor = makeActor(OrganizationRole.APPROVER, 'user-1');
      mockRepo.findOne!.mockResolvedValue(
        makeRequisition({ status: RequisitionStatus.SUBMITTED, requestedBy: 'user-1' }),
      );

      await expect(service.approve('req-1', actor)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── reject ────────────────────────────────────────────────────────────────

  describe('reject', () => {
    it('transitions SUBMITTED → REJECTED with a reason', async () => {
      const actor = makeActor(OrganizationRole.APPROVER, 'user-approver');
      const req = makeRequisition({
        status: RequisitionStatus.SUBMITTED,
        requestedBy: 'user-1',
        totalAmount: 1000 as any,
      });
      mockRepo.findOne!.mockResolvedValue(req);
      mockRepo.update!.mockResolvedValue({ ...req, status: RequisitionStatus.REJECTED });

      await service.reject('req-1', 'Budget exceeded', actor);
      expect(mockRepo.update).toHaveBeenCalledWith(
        'req-1',
        expect.objectContaining({
          status: RequisitionStatus.REJECTED,
          rejectedReason: 'Budget exceeded',
        }),
      );
    });

    it('throws BadRequestException when reason is empty', async () => {
      const actor = makeActor(OrganizationRole.APPROVER, 'user-approver');
      mockRepo.findOne!.mockResolvedValue(
        makeRequisition({ status: RequisitionStatus.SUBMITTED, requestedBy: 'user-1' }),
      );

      await expect(service.reject('req-1', '', actor)).rejects.toThrow(BadRequestException);
    });
  });
});
