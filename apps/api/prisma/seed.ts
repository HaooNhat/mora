import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000);

// ─────────────────────────────────────────────────────────────────────────────
// Role capability matrix (new 4-role model)
//
//  OWNER   → full access + payment approval
//            approves PRs of any amount, creates/sends/cancels POs, processes payments
//  MANAGER → approves/rejects PRs, read-all
//            approves PRs (responsible for review), cannot create POs or process payments
//  FINANCE → creates POs, sends POs, approves invoices
//            triggers ORDER on PR when creating a PO
//  STAFF   → creates and submits requisitions, receives goods
//
// Auto-approval threshold: totalAmount < 500 → status = APPROVED, no human approver
//
// NOTE: requisitions.policy.ts and purchase-orders.policy.ts still reference
// the old roles (APPROVER, FINANCE_MANAGER, BUYER, etc.) and must be updated
// separately to match this new model.
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...');

  const PASSWORD = 'Test1234!';
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ── Organizations ─────────────────────────────────────────────────────────

  const acme =
    (await prisma.organization.findFirst({ where: { name: 'Acme Corp' } })) ??
    (await prisma.organization.create({
      data: {
        name: 'Acme Corp',
        legalName: 'Acme Corporation Ltd.',
        type: 'BOTH',
        email: 'info@acmecorp.com',
        isActive: true,
      },
    }));

  const techsupply =
    (await prisma.organization.findFirst({
      where: { name: 'TechSupply Inc' },
    })) ??
    (await prisma.organization.create({
      data: {
        name: 'TechSupply Inc',
        legalName: 'TechSupply Incorporated',
        type: 'SUPPLIER',
        email: 'info@techsupply.com',
        isActive: true,
      },
    }));

  // ── Users — Acme Corp ────────────────────────────────────────────────────

  const acmeUserDefs = [
    {
      email: 'owner@acme.com',
      firstName: 'Alice',
      lastName: 'Chen',
      role: 'OWNER' as const,
    },
    {
      email: 'manager@acme.com',
      firstName: 'Bob',
      lastName: 'Martinez',
      role: 'MANAGER' as const,
    },
    {
      email: 'finance@acme.com',
      firstName: 'Carol',
      lastName: 'Smith',
      role: 'FINANCE' as const,
    },
    {
      email: 'staff@acme.com',
      firstName: 'David',
      lastName: 'Kim',
      role: 'STAFF' as const,
    },
  ];

  const acmeUsers: Record<string, string> = {}; // role → userId
  for (const def of acmeUserDefs) {
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: {
        email: def.email,
        passwordHash,
        firstName: def.firstName,
        lastName: def.lastName,
        isEmailVerified: true,
        isActive: true,
      },
    });
    acmeUsers[def.role] = user.id;

    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: { organizationId: acme.id, userId: user.id },
      },
      update: { role: def.role },
      create: {
        organizationId: acme.id,
        userId: user.id,
        role: def.role,
        isPrimary: true,
        isActive: true,
      },
    });
  }

  // ── Users — TechSupply Inc ───────────────────────────────────────────────

  const tsUserDefs = [
    {
      email: 'owner@techsupply.com',
      firstName: 'Eve',
      lastName: 'Johnson',
      role: 'OWNER' as const,
    },
    {
      email: 'finance@techsupply.com',
      firstName: 'Frank',
      lastName: 'Lee',
      role: 'FINANCE' as const,
    },
    {
      email: 'staff@techsupply.com',
      firstName: 'Grace',
      lastName: 'Park',
      role: 'STAFF' as const,
    },
  ];

  const tsUsers: Record<string, string> = {};
  for (const def of tsUserDefs) {
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: {
        email: def.email,
        passwordHash,
        firstName: def.firstName,
        lastName: def.lastName,
        isEmailVerified: true,
        isActive: true,
      },
    });
    tsUsers[def.role] = user.id;

    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: techsupply.id,
          userId: user.id,
        },
      },
      update: { role: def.role },
      create: {
        organizationId: techsupply.id,
        userId: user.id,
        role: def.role,
        isPrimary: true,
        isActive: true,
      },
    });
  }

  // Role-keyed IDs for readability
  const acmeOwner = acmeUsers['OWNER']!;
  const acmeMgr = acmeUsers['MANAGER']!;
  const acmeFinance = acmeUsers['FINANCE']!;
  const acmeStaff = acmeUsers['STAFF']!;
  const tsOwner = tsUsers['OWNER']!;
  const tsFinance = tsUsers['FINANCE']!;

  // ── Reset documents (order respects FK constraints) ──────────────────────

  await prisma.auditLog.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.goodsReceiptItem.deleteMany({});
  await prisma.goodsReceipt.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.purchaseRequisitionItem.deleteMany({});
  await prisma.purchaseRequisition.deleteMany({});

  // ── Requisitions ─────────────────────────────────────────────────────────
  //
  // Validation rules applied:
  //   requestedBy  = STAFF (primary creator role)
  //   amount < 500 → APPROVED immediately, approvedBy = null (auto-approve)
  //   500–4999     → MANAGER approves
  //   ≥ 5000       → OWNER approves (full access + payment authority)
  //   ORDERED      = PR that has a PO already created from it
  //   Any PR with a linked PO must be in ORDERED status — not APPROVED

  // 1. DRAFT — work in progress
  const reqDraft1 = await prisma.purchaseRequisition.create({
    data: {
      organizationId: acme.id,
      title: 'Office Supplies Q3',
      description: 'Quarterly office supplies replenishment',
      status: 'DRAFT',
      requestedBy: acmeStaff,
      totalAmount: 320.0,
      currency: 'USD',
      items: {
        create: [
          {
            description: 'Ballpoint Pens (box of 50)',
            quantity: 4,
            unitPrice: 12.5,
            totalPrice: 50.0,
            currency: 'USD',
          },
          {
            description: 'A4 Printing Paper (ream)',
            quantity: 10,
            unitPrice: 8.0,
            totalPrice: 80.0,
            currency: 'USD',
          },
          {
            description: 'Sticky Notes Assorted (pack)',
            quantity: 6,
            unitPrice: 15.0,
            totalPrice: 90.0,
            currency: 'USD',
            notes: 'Assorted colors preferred',
          },
          {
            description: 'Whiteboard Markers (set)',
            quantity: 5,
            unitPrice: 20.0,
            totalPrice: 100.0,
            currency: 'USD',
          },
        ],
      },
    },
  });
  // 50 + 80 + 90 + 100 = 320 ✓

  // 2. DRAFT — larger, still being drafted
  const reqDraft2 = await prisma.purchaseRequisition.create({
    data: {
      organizationId: acme.id,
      title: 'Ergonomic Accessories',
      description: 'Ergonomic accessories for remote employees',
      status: 'DRAFT',
      requestedBy: acmeStaff,
      totalAmount: 1380.0,
      currency: 'USD',
      items: {
        create: [
          {
            description: 'Ergonomic Mouse Pad with Wrist Rest',
            quantity: 8,
            unitPrice: 35.0,
            totalPrice: 280.0,
            currency: 'USD',
          },
          {
            description: 'USB-C Hub 7-in-1',
            quantity: 8,
            unitPrice: 75.0,
            totalPrice: 600.0,
            currency: 'USD',
          },
          {
            description: 'Laptop Stand Adjustable',
            quantity: 5,
            unitPrice: 100.0,
            totalPrice: 500.0,
            currency: 'USD',
          },
        ],
      },
    },
  });
  // 280 + 600 + 500 = 1380 ✓

  // 3. SUBMITTED — awaiting MANAGER approval ($1,800 is in 500–4999 range)
  const reqSubmitted = await prisma.purchaseRequisition.create({
    data: {
      organizationId: acme.id,
      title: 'Software Licenses Renewal',
      description: 'Annual software license renewal for design team',
      status: 'SUBMITTED',
      requestedBy: acmeStaff,
      requestedAt: daysAgo(2),
      totalAmount: 1800.0,
      currency: 'USD',
      items: {
        create: [
          {
            description: 'Adobe Creative Cloud (1 year × 3 seats)',
            quantity: 3,
            unitPrice: 400.0,
            totalPrice: 1200.0,
            currency: 'USD',
          },
          {
            description: 'Figma Professional (1 year × 3 seats)',
            quantity: 3,
            unitPrice: 200.0,
            totalPrice: 600.0,
            currency: 'USD',
          },
        ],
      },
    },
  });
  // 1200 + 600 = 1800 ✓

  // 4. APPROVED — auto-approved (amount $240 < $500 threshold, no human approver)
  const reqAutoApproved = await prisma.purchaseRequisition.create({
    data: {
      organizationId: acme.id,
      title: 'Reception Stationery Top-up',
      description: 'Small stationery top-up for the reception area',
      status: 'APPROVED',
      requestedBy: acmeStaff,
      requestedAt: daysAgo(4),
      approvedBy: null, // system auto-approve — no human actor
      approvedAt: daysAgo(4), // same moment as submission
      totalAmount: 240.0,
      currency: 'USD',
      items: {
        create: [
          {
            description: 'A5 Notebooks (pack of 6)',
            quantity: 4,
            unitPrice: 18.0,
            totalPrice: 72.0,
            currency: 'USD',
          },
          {
            description: 'Ballpoint Pens Refill (pack of 20)',
            quantity: 2,
            unitPrice: 8.0,
            totalPrice: 16.0,
            currency: 'USD',
          },
          {
            description: 'Sticky Notes Large (pack)',
            quantity: 4,
            unitPrice: 12.0,
            totalPrice: 48.0,
            currency: 'USD',
          },
          {
            description: 'Paper Clips (box of 200)',
            quantity: 8,
            unitPrice: 3.0,
            totalPrice: 24.0,
            currency: 'USD',
          },
          {
            description: 'Scissors (pack of 5)',
            quantity: 2,
            unitPrice: 10.0,
            totalPrice: 20.0,
            currency: 'USD',
          },
          {
            description: 'Tape Dispenser Refill (pack of 6)',
            quantity: 5,
            unitPrice: 12.0,
            totalPrice: 60.0,
            currency: 'USD',
          },
        ],
      },
    },
  });
  // 72 + 16 + 48 + 24 + 20 + 60 = 240 ✓

  // 5. APPROVED — manually approved by MANAGER ($2,750 is in 500–4999 range → MANAGER authority)
  const reqApproved = await prisma.purchaseRequisition.create({
    data: {
      organizationId: acme.id,
      title: 'Standing Desks for Engineering',
      description: 'Height-adjustable desks for the engineering team',
      status: 'APPROVED',
      requestedBy: acmeStaff,
      requestedAt: daysAgo(10),
      approvedBy: acmeMgr,
      approvedAt: daysAgo(8),
      totalAmount: 2750.0,
      currency: 'USD',
      items: {
        create: [
          {
            description: 'Electric Standing Desk 60"',
            quantity: 5,
            unitPrice: 450.0,
            totalPrice: 2250.0,
            currency: 'USD',
          },
          {
            description: 'Anti-fatigue Mat',
            quantity: 5,
            unitPrice: 100.0,
            totalPrice: 500.0,
            currency: 'USD',
          },
        ],
      },
    },
  });
  // 2250 + 500 = 2750 ✓

  // 6. REJECTED — rejected by OWNER ($22,000 ≥ $5,000 → OWNER authority)
  const reqRejected = await prisma.purchaseRequisition.create({
    data: {
      organizationId: acme.id,
      title: 'Executive Conference Room AV System',
      description: 'Full AV setup for the executive conference room',
      status: 'REJECTED',
      requestedBy: acmeStaff,
      requestedAt: daysAgo(7),
      approvedBy: acmeOwner,
      approvedAt: daysAgo(5),
      rejectedReason:
        'Budget exceeded for Q3. Please resubmit next quarter with updated vendor quotes.',
      totalAmount: 22000.0,
      currency: 'USD',
      items: {
        create: [
          {
            description: '85" 4K Smart TV',
            quantity: 1,
            unitPrice: 3500.0,
            totalPrice: 3500.0,
            currency: 'USD',
          },
          {
            description: 'Video Conferencing System',
            quantity: 1,
            unitPrice: 8500.0,
            totalPrice: 8500.0,
            currency: 'USD',
          },
          {
            description: 'Wireless Presentation Hub',
            quantity: 2,
            unitPrice: 2500.0,
            totalPrice: 5000.0,
            currency: 'USD',
          },
          {
            description: 'Ceiling Microphone Array',
            quantity: 1,
            unitPrice: 3000.0,
            totalPrice: 3000.0,
            currency: 'USD',
          },
          {
            description: 'Installation & Setup',
            quantity: 1,
            unitPrice: 2000.0,
            totalPrice: 2000.0,
            currency: 'USD',
          },
        ],
      },
    },
  });
  // 3500 + 8500 + 5000 + 3000 + 2000 = 22000 ✓

  // 7–10. ORDERED — each linked to a PO at a different lifecycle stage.
  // RULE: a PR moves to ORDERED the moment a PO is created from it (markOrdered).
  //       These PRs must NOT be in APPROVED status even if the linked PO is DRAFT.

  // PR for DRAFT PO — $9,600 ≥ $5,000 → OWNER approves
  const reqForDraftPO = await prisma.purchaseRequisition.create({
    data: {
      organizationId: acme.id,
      title: 'Developer Workstations',
      description: 'High-performance workstations for the backend team',
      status: 'ORDERED',
      requestedBy: acmeStaff,
      requestedAt: daysAgo(5),
      approvedBy: acmeOwner,
      approvedAt: daysAgo(3),
      totalAmount: 9600.0,
      currency: 'USD',
      items: {
        create: [
          {
            description: 'MacBook Pro 16" M3 Max',
            quantity: 3,
            unitPrice: 2800.0,
            totalPrice: 8400.0,
            currency: 'USD',
          },
          {
            description: 'Apple Magic Keyboard',
            quantity: 3,
            unitPrice: 129.0,
            totalPrice: 387.0,
            currency: 'USD',
          },
          {
            description: 'Apple Magic Mouse',
            quantity: 3,
            unitPrice: 79.0,
            totalPrice: 237.0,
            currency: 'USD',
          },
          {
            description: 'Thunderbolt 4 Dock',
            quantity: 2,
            unitPrice: 199.5,
            totalPrice: 399.0,
            currency: 'USD',
          },
          {
            description: 'USB-C to HDMI Adapter',
            quantity: 3,
            unitPrice: 59.0,
            totalPrice: 177.0,
            currency: 'USD',
          },
        ],
      },
    },
  });
  // 8400 + 387 + 237 + 399 + 177 = 9600 ✓

  // PR for SENT PO — $11,500 ≥ $5,000 → OWNER approves
  const reqForSentPO = await prisma.purchaseRequisition.create({
    data: {
      organizationId: acme.id,
      title: 'Server Room Networking Upgrade',
      description: 'Networking hardware for server room expansion',
      status: 'ORDERED',
      requestedBy: acmeStaff,
      requestedAt: daysAgo(15),
      approvedBy: acmeOwner,
      approvedAt: daysAgo(12),
      totalAmount: 11500.0,
      currency: 'USD',
      items: {
        create: [
          {
            description: 'Managed Network Switch 48-port',
            quantity: 2,
            unitPrice: 3500.0,
            totalPrice: 7000.0,
            currency: 'USD',
          },
          {
            description: '27" 4K Monitor',
            quantity: 4,
            unitPrice: 750.0,
            totalPrice: 3000.0,
            currency: 'USD',
          },
          {
            description: 'KVM Switch 8-port',
            quantity: 2,
            unitPrice: 275.0,
            totalPrice: 550.0,
            currency: 'USD',
          },
          {
            description: 'Cat6A Ethernet Cable (1000ft)',
            quantity: 3,
            unitPrice: 150.0,
            totalPrice: 450.0,
            currency: 'USD',
          },
          {
            description: 'Rack Mount Shelf',
            quantity: 5,
            unitPrice: 100.0,
            totalPrice: 500.0,
            currency: 'USD',
          },
        ],
      },
    },
  });
  // 7000 + 3000 + 550 + 450 + 500 = 11500 ✓

  // PR for CONFIRMED PO — $6,250 ≥ $5,000 → OWNER approves
  const reqForConfirmedPO = await prisma.purchaseRequisition.create({
    data: {
      organizationId: acme.id,
      title: 'Monitor Refresh Program',
      description: 'Replacing aging monitors for marketing and sales teams',
      status: 'ORDERED',
      requestedBy: acmeStaff,
      requestedAt: daysAgo(25),
      approvedBy: acmeOwner,
      approvedAt: daysAgo(22),
      totalAmount: 6250.0,
      currency: 'USD',
      items: {
        create: [
          {
            description: '27" QHD IPS Monitor',
            quantity: 10,
            unitPrice: 550.0,
            totalPrice: 5500.0,
            currency: 'USD',
          },
          {
            description: 'Monitor Arm Dual',
            quantity: 5,
            unitPrice: 90.0,
            totalPrice: 450.0,
            currency: 'USD',
          },
          {
            description: 'HDMI Cable 2m (pack of 2)',
            quantity: 10,
            unitPrice: 30.0,
            totalPrice: 300.0,
            currency: 'USD',
          },
        ],
      },
    },
  });
  // 5500 + 450 + 300 = 6250 ✓

  // PR for RECEIVED PO — $7,800 ≥ $5,000 → OWNER approves
  const reqForReceivedPO = await prisma.purchaseRequisition.create({
    data: {
      organizationId: acme.id,
      title: 'UPS Battery Backup Units',
      description: 'Uninterruptible power supplies for the server room',
      status: 'ORDERED',
      requestedBy: acmeStaff,
      requestedAt: daysAgo(45),
      approvedBy: acmeOwner,
      approvedAt: daysAgo(42),
      totalAmount: 7800.0,
      currency: 'USD',
      items: {
        create: [
          {
            description: 'APC Smart-UPS 1500VA',
            quantity: 6,
            unitPrice: 800.0,
            totalPrice: 4800.0,
            currency: 'USD',
          },
          {
            description: 'Replacement Battery Cartridge',
            quantity: 6,
            unitPrice: 150.0,
            totalPrice: 900.0,
            currency: 'USD',
          },
          {
            description: 'PowerChute Network Management Card',
            quantity: 6,
            unitPrice: 350.0,
            totalPrice: 2100.0,
            currency: 'USD',
          },
        ],
      },
    },
  });
  // 4800 + 900 + 2100 = 7800 ✓

  // ── Purchase Orders ──────────────────────────────────────────────────────
  //
  // Validation rules applied:
  //   createdBy   = FINANCE (FINANCE role creates POs)
  //   SEND        = FINANCE sends PO to supplier
  //   CONFIRM     = supplier OWNER acknowledges (approvedBy = tsOwner)
  //   subtotal + shippingAmount = totalAmount (enforced in every row)
  //   requisitionId → must reference a PR in ORDERED status (see above)

  // PO-1: DRAFT — just created, not yet sent to supplier
  const poDraft = await prisma.purchaseOrder.create({
    data: {
      requisitionId: reqForDraftPO.id,
      buyerOrgId: acme.id,
      supplierOrgId: techsupply.id,
      status: 'DRAFT',
      orderDate: daysAgo(2),
      expectedDate: daysFromNow(14),
      subtotal: 9600.0,
      shippingAmount: 0,
      totalAmount: 9600.0, // 9600 + 0 ✓
      currency: 'USD',
      createdBy: acmeFinance,
      notes: 'Draft — pending internal review before sending to supplier.',
      items: {
        create: [
          {
            description: 'MacBook Pro 16" M3 Max',
            quantity: 3,
            unitPrice: 2800.0,
            totalPrice: 8400.0,
            currency: 'USD',
          },
          {
            description: 'Apple Magic Keyboard',
            quantity: 3,
            unitPrice: 129.0,
            totalPrice: 387.0,
            currency: 'USD',
          },
          {
            description: 'Apple Magic Mouse',
            quantity: 3,
            unitPrice: 79.0,
            totalPrice: 237.0,
            currency: 'USD',
          },
          {
            description: 'Thunderbolt 4 Dock',
            quantity: 2,
            unitPrice: 199.5,
            totalPrice: 399.0,
            currency: 'USD',
          },
          {
            description: 'USB-C to HDMI Adapter',
            quantity: 3,
            unitPrice: 59.0,
            totalPrice: 177.0,
            currency: 'USD',
          },
        ],
      },
    },
  });

  // PO-2: SENT — sent to supplier, awaiting confirmation
  const poSent = await prisma.purchaseOrder.create({
    data: {
      requisitionId: reqForSentPO.id,
      buyerOrgId: acme.id,
      supplierOrgId: techsupply.id,
      status: 'SENT',
      orderDate: daysAgo(10),
      expectedDate: daysFromNow(7),
      subtotal: 11500.0,
      shippingAmount: 250.0,
      totalAmount: 11750.0, // 11500 + 250 ✓
      currency: 'USD',
      createdBy: acmeFinance,
      notes: 'Please confirm availability of all line items before shipping.',
      items: {
        create: [
          {
            description: 'Managed Network Switch 48-port',
            quantity: 2,
            unitPrice: 3500.0,
            totalPrice: 7000.0,
            currency: 'USD',
          },
          {
            description: '27" 4K Monitor',
            quantity: 4,
            unitPrice: 750.0,
            totalPrice: 3000.0,
            currency: 'USD',
          },
          {
            description: 'KVM Switch 8-port',
            quantity: 2,
            unitPrice: 275.0,
            totalPrice: 550.0,
            currency: 'USD',
          },
          {
            description: 'Cat6A Ethernet Cable (1000ft)',
            quantity: 3,
            unitPrice: 150.0,
            totalPrice: 450.0,
            currency: 'USD',
          },
          {
            description: 'Rack Mount Shelf',
            quantity: 5,
            unitPrice: 100.0,
            totalPrice: 500.0,
            currency: 'USD',
          },
        ],
      },
    },
  });

  // PO-3: CONFIRMED — supplier acknowledged, delivery expected soon
  // approvedBy = tsOwner (supplier OWNER confirms POs)
  const poConfirmed = await prisma.purchaseOrder.create({
    data: {
      requisitionId: reqForConfirmedPO.id,
      buyerOrgId: acme.id,
      supplierOrgId: techsupply.id,
      status: 'CONFIRMED',
      orderDate: daysAgo(20),
      expectedDate: daysFromNow(2),
      subtotal: 6250.0,
      shippingAmount: 120.0,
      totalAmount: 6370.0, // 6250 + 120 ✓
      currency: 'USD',
      createdBy: acmeFinance,
      approvedBy: tsOwner,
      approvedAt: daysAgo(17),
      notes: 'Confirmed by TechSupply. Delivery expected in 2 days.',
      items: {
        create: [
          {
            description: '27" QHD IPS Monitor',
            quantity: 10,
            unitPrice: 550.0,
            totalPrice: 5500.0,
            currency: 'USD',
          },
          {
            description: 'Monitor Arm Dual',
            quantity: 5,
            unitPrice: 90.0,
            totalPrice: 450.0,
            currency: 'USD',
          },
          {
            description: 'HDMI Cable 2m (pack of 2)',
            quantity: 10,
            unitPrice: 30.0,
            totalPrice: 300.0,
            currency: 'USD',
          },
        ],
      },
    },
  });

  // PO-4: RECEIVED — all goods received, ready for invoicing
  const poReceived = await prisma.purchaseOrder.create({
    data: {
      requisitionId: reqForReceivedPO.id,
      buyerOrgId: acme.id,
      supplierOrgId: techsupply.id,
      status: 'RECEIVED',
      orderDate: daysAgo(42),
      expectedDate: daysAgo(28),
      subtotal: 7800.0,
      shippingAmount: 180.0,
      totalAmount: 7980.0, // 7800 + 180 ✓
      currency: 'USD',
      createdBy: acmeFinance,
      approvedBy: tsOwner,
      approvedAt: daysAgo(39),
      notes: 'All items received in good condition.',
      items: {
        create: [
          {
            description: 'APC Smart-UPS 1500VA',
            quantity: 6,
            unitPrice: 800.0,
            totalPrice: 4800.0,
            currency: 'USD',
          },
          {
            description: 'Replacement Battery Cartridge',
            quantity: 6,
            unitPrice: 150.0,
            totalPrice: 900.0,
            currency: 'USD',
          },
          {
            description: 'PowerChute Network Management Card',
            quantity: 6,
            unitPrice: 350.0,
            totalPrice: 2100.0,
            currency: 'USD',
          },
        ],
      },
    },
  });

  // PO-5: CANCELLED — cancelled after being sent (no PR, standalone order)
  // RULE: cancellation is only valid before PARTIALLY_RECEIVED
  //       actor = FINANCE or OWNER (buyer-side roles that can cancel)
  // const poCancelled = await prisma.purchaseOrder.create({
  //   data: {
  //     requisitionId: null,
  //     buyerOrgId: acme.id,
  //     supplierOrgId: techsupply.id,
  //     status: 'CANCELLED',
  //     orderDate: daysAgo(8),
  //     expectedDate: daysFromNow(10),
  //     subtotal: 3200.0,
  //     shippingAmount: 0,
  //     totalAmount: 3200.0, // 3200 + 0 ✓
  //     currency: 'USD',
  //     createdBy: acmeFinance,
  //     notes: 'Cancelled — vendor unable to fulfil within required timeframe.',
  //     items: {
  //       create: [
  //         {
  //           description: 'Wireless Keyboard and Mouse Combo (bulk)',
  //           quantity: 20,
  //           unitPrice: 80.0,
  //           totalPrice: 1600.0,
  //           currency: 'USD',
  //         },
  //         {
  //           description: 'USB 3.0 Hub 4-port (bulk)',
  //           quantity: 40,
  //           unitPrice: 40.0,
  //           totalPrice: 1600.0,
  //           currency: 'USD',
  //         },
  //       ],
  //     },
  //   },
  // });

  // ── Goods Receipt ────────────────────────────────────────────────────────
  // RULE: receivedBy = STAFF (STAFF receives goods on behalf of buyer org)
  //       Only for RECEIVED PO — CONFIRMED PO awaits delivery, no receipt yet.

  const poReceivedItems = await prisma.purchaseOrderItem.findMany({
    where: { orderId: poReceived.id },
    orderBy: { createdAt: 'asc' },
  });
  // Ordered by creation: [SmartUPS, Battery, PowerChute]
  const [upsItem, batteryItem, powerChuteItem] = poReceivedItems;

  const goodsReceipt = await prisma.goodsReceipt.create({
    data: {
      orderId: poReceived.id,
      receivedBy: acmeStaff,
      receivedAt: daysAgo(30),
      notes: 'All 3 line items received and inspected. No visible damage.',
      items: {
        create: [
          {
            orderItemId: upsItem?.id ?? null,
            description: 'APC Smart-UPS 1500VA',
            quantityOrdered: 6,
            quantityReceived: 6,
          },
          {
            orderItemId: batteryItem?.id ?? null,
            description: 'Replacement Battery Cartridge',
            quantityOrdered: 6,
            quantityReceived: 6,
          },
          {
            orderItemId: powerChuteItem?.id ?? null,
            description: 'PowerChute Network Management Card',
            quantityOrdered: 6,
            quantityReceived: 6,
          },
        ],
      },
    },
  });

  // ── Invoices ─────────────────────────────────────────────────────────────
  // RULE: createdBy = supplier FINANCE (tsFinance — supplier side submits invoice)
  //       approvedBy = buyer FINANCE (acmeFinance approves invoices per role definition)
  //       An invoice can only be submitted against a RECEIVED PO
  //       paidAmount = totalAmount when status = PAID
  //       paidDate must be set when status = PAID

  // Invoice-1: SUBMITTED — just submitted by supplier, 3-way match pending
  const invoiceSubmitted = await prisma.invoice.create({
    data: {
      status: 'SUBMITTED',
      supplierOrgId: techsupply.id,
      buyerOrgId: acme.id,
      orderId: poReceived.id,
      issueDate: daysAgo(28),
      dueDate: daysFromNow(2),
      subtotal: 7980.0,
      discountAmount: 0,
      totalAmount: 7980.0,
      paidAmount: 0,
      currency: 'USD',
      createdBy: tsFinance,
      items: {
        create: [
          {
            orderItemId: upsItem?.id,
            description: 'APC Smart-UPS 1500VA',
            quantity: 6,
            unitPrice: 800.0,
            discountRate: 0,
            discountAmount: 0,
            totalPrice: 4800.0,
            currency: 'USD',
          },
          {
            orderItemId: batteryItem?.id,
            description: 'Replacement Battery Cartridge',
            quantity: 6,
            unitPrice: 150.0,
            discountRate: 0,
            discountAmount: 0,
            totalPrice: 900.0,
            currency: 'USD',
          },
          {
            orderItemId: powerChuteItem?.id,
            description: 'PowerChute Network Management Card',
            quantity: 6,
            unitPrice: 350.0,
            discountRate: 0,
            discountAmount: 0,
            totalPrice: 2100.0,
            currency: 'USD',
          },
          {
            orderItemId: null,
            description: 'Shipping & Handling',
            quantity: 1,
            unitPrice: 180.0,
            discountRate: 0,
            discountAmount: 0,
            totalPrice: 180.0,
            currency: 'USD',
          },
        ],
      },
    },
  });

  // Invoice-2: EXCEPTION — price variance on one item, needs manual review
  const invoiceException = await prisma.invoice.create({
    data: {
      status: 'EXCEPTION',
      supplierOrgId: techsupply.id,
      buyerOrgId: acme.id,
      orderId: poReceived.id,
      issueDate: daysAgo(25),
      dueDate: daysFromNow(5),
      subtotal: 5400.0,
      discountAmount: 0,
      totalAmount: 5400.0,
      paidAmount: 0,
      currency: 'USD',
      matchNotes:
        "Price variance on 'APC Smart-UPS 1500VA': invoiced $900/unit vs PO $800/unit (12.5% — exceeds 5% tolerance).",
      createdBy: tsFinance,
      items: {
        create: [
          {
            orderItemId: upsItem?.id,
            description: 'APC Smart-UPS 1500VA',
            quantity: 6,
            unitPrice: 900.0,
            discountRate: 0,
            discountAmount: 0,
            totalPrice: 5400.0,
            currency: 'USD',
          },
        ],
      },
    },
  });

  // Invoice-3: APPROVED — 3-way match passed, approved by buyer FINANCE
  const invoiceApproved = await prisma.invoice.create({
    data: {
      status: 'APPROVED',
      supplierOrgId: techsupply.id,
      buyerOrgId: acme.id,
      orderId: poReceived.id,
      issueDate: daysAgo(35),
      dueDate: daysAgo(5),
      subtotal: 7800.0,
      discountAmount: 0,
      totalAmount: 7800.0,
      paidAmount: 0,
      currency: 'USD',
      matchNotes:
        'All 3 line items passed the 3-way match within 2% tolerance.',
      createdBy: tsFinance,
      approvedBy: acmeFinance, // FINANCE approves invoices
      approvedAt: daysAgo(30),
      items: {
        create: [
          {
            orderItemId: upsItem?.id,
            description: 'APC Smart-UPS 1500VA',
            quantity: 6,
            unitPrice: 800.0,
            discountRate: 0,
            discountAmount: 0,
            totalPrice: 4800.0,
            currency: 'USD',
          },
          {
            orderItemId: batteryItem?.id,
            description: 'Replacement Battery Cartridge',
            quantity: 6,
            unitPrice: 150.0,
            discountRate: 0,
            discountAmount: 0,
            totalPrice: 900.0,
            currency: 'USD',
          },
          {
            orderItemId: powerChuteItem?.id,
            description: 'PowerChute Network Management Card',
            quantity: 6,
            unitPrice: 350.0,
            discountRate: 0,
            discountAmount: 0,
            totalPrice: 2100.0,
            currency: 'USD',
          },
        ],
      },
    },
  });

  // Invoice-4: PAID — fully settled
  const invoicePaid = await prisma.invoice.create({
    data: {
      status: 'PAID',
      supplierOrgId: techsupply.id,
      buyerOrgId: acme.id,
      orderId: poReceived.id,
      issueDate: daysAgo(60),
      dueDate: daysAgo(30),
      paidDate: daysAgo(31),
      subtotal: 900.0,
      discountAmount: 0,
      totalAmount: 900.0,
      paidAmount: 900.0, // paidAmount = totalAmount when PAID ✓
      currency: 'USD',
      matchNotes: '1 line item passed the 3-way match.',
      createdBy: tsFinance,
      approvedBy: acmeFinance,
      approvedAt: daysAgo(55),
      items: {
        create: [
          {
            orderItemId: batteryItem?.id,
            description: 'Replacement Battery Cartridge',
            quantity: 6,
            unitPrice: 150.0,
            discountRate: 0,
            discountAmount: 0,
            totalPrice: 900.0,
            currency: 'USD',
          },
        ],
      },
    },
  });

  // ── Payments ─────────────────────────────────────────────────────────────
  // RULE: payerOrgId = buyer (acme), payeeOrgId = supplier (techsupply)
  //       OWNER processes payments ("full access + payment approval")

  await prisma.payment.create({
    data: {
      invoiceId: invoicePaid.id,
      payerOrgId: acme.id,
      payeeOrgId: techsupply.id,
      amount: 900.0,
      currency: 'USD',
      status: 'SUCCESS',
      method: 'bank_transfer',
      notes: 'Wire transfer confirmed. Ref: TXN-2026-00341.',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoiceApproved.id,
      payerOrgId: acme.id,
      payeeOrgId: techsupply.id,
      amount: 7800.0,
      currency: 'USD',
      status: 'PENDING',
      method: 'bank_transfer',
      notes: 'Wire transfer initiated. Awaiting bank confirmation.',
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: null,
      payerOrgId: acme.id,
      payeeOrgId: techsupply.id,
      amount: 1800.0,
      currency: 'USD',
      status: 'FAILED',
      method: 'check',
      notes:
        'Check returned — insufficient funds. Please retry with bank transfer.',
    },
  });

  // ── Audit Logs ───────────────────────────────────────────────────────────
  //
  // Each entry mirrors what TransitionExecutor.executeWithAudit() writes at runtime.
  //
  // REQUISITION events : SUBMIT · APPROVE · REJECT · ORDER
  // PURCHASE_ORDER events : SEND · CONFIRM · CANCEL · RECEIVE
  //
  // publishedAt = set     → outbox has already delivered the event
  // publishedAt = null    → recent transition, not yet published

  const logs: Prisma.AuditLogCreateManyInput[] = [
    // ── reqSubmitted : DRAFT → SUBMITTED ──────────────────────────────────
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqSubmitted.id,
      event: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      actorId: acmeStaff,
      metadata: {},
      publishedAt: daysAgo(2),
      createdAt: daysAgo(2),
    },

    // ── reqAutoApproved : DRAFT → APPROVED (system, single log) ──────────
    // Auto-approve collapses into the SUBMIT event — toStatus = APPROVED directly.
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqAutoApproved.id,
      event: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'APPROVED',
      actorId: acmeStaff,
      metadata: { autoApproved: true },
      publishedAt: daysAgo(4),
      createdAt: daysAgo(4),
    },

    // ── reqApproved : DRAFT → SUBMITTED → APPROVED ────────────────────────
    // $2,750 → MANAGER approves
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqApproved.id,
      event: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      actorId: acmeStaff,
      metadata: {},
      publishedAt: daysAgo(10),
      createdAt: daysAgo(10),
    },
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqApproved.id,
      event: 'APPROVE',
      fromStatus: 'SUBMITTED',
      toStatus: 'APPROVED',
      actorId: acmeMgr,
      metadata: {},
      publishedAt: daysAgo(8),
      createdAt: daysAgo(8),
    },

    // ── reqRejected : DRAFT → SUBMITTED → REJECTED ────────────────────────
    // $22,000 → OWNER rejects
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqRejected.id,
      event: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      actorId: acmeStaff,
      metadata: {},
      publishedAt: daysAgo(7),
      createdAt: daysAgo(7),
    },
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqRejected.id,
      event: 'REJECT',
      fromStatus: 'SUBMITTED',
      toStatus: 'REJECTED',
      actorId: acmeOwner,
      metadata: {
        rejectedReason:
          'Budget exceeded for Q3. Please resubmit next quarter with updated vendor quotes.',
      },
      publishedAt: daysAgo(5),
      createdAt: daysAgo(5),
    },

    // ── reqForDraftPO : DRAFT → SUBMITTED → APPROVED → ORDERED ───────────
    // $9,600 → OWNER approves; FINANCE creates PO triggering ORDER
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForDraftPO.id,
      event: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      actorId: acmeStaff,
      metadata: {},
      publishedAt: daysAgo(5),
      createdAt: daysAgo(5),
    },
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForDraftPO.id,
      event: 'APPROVE',
      fromStatus: 'SUBMITTED',
      toStatus: 'APPROVED',
      actorId: acmeOwner,
      metadata: {},
      publishedAt: daysAgo(3),
      createdAt: daysAgo(3),
    },
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForDraftPO.id,
      event: 'ORDER',
      fromStatus: 'APPROVED',
      toStatus: 'ORDERED',
      actorId: acmeFinance,
      metadata: {},
      publishedAt: daysAgo(2),
      createdAt: daysAgo(2),
    },

    // ── reqForSentPO : full trail ─────────────────────────────────────────
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForSentPO.id,
      event: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      actorId: acmeStaff,
      metadata: {},
      publishedAt: daysAgo(15),
      createdAt: daysAgo(15),
    },
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForSentPO.id,
      event: 'APPROVE',
      fromStatus: 'SUBMITTED',
      toStatus: 'APPROVED',
      actorId: acmeOwner,
      metadata: {},
      publishedAt: daysAgo(12),
      createdAt: daysAgo(12),
    },
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForSentPO.id,
      event: 'ORDER',
      fromStatus: 'APPROVED',
      toStatus: 'ORDERED',
      actorId: acmeFinance,
      metadata: {},
      publishedAt: daysAgo(10),
      createdAt: daysAgo(10),
    },

    // ── reqForConfirmedPO : full trail ────────────────────────────────────
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForConfirmedPO.id,
      event: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      actorId: acmeStaff,
      metadata: {},
      publishedAt: daysAgo(25),
      createdAt: daysAgo(25),
    },
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForConfirmedPO.id,
      event: 'APPROVE',
      fromStatus: 'SUBMITTED',
      toStatus: 'APPROVED',
      actorId: acmeOwner,
      metadata: {},
      publishedAt: daysAgo(22),
      createdAt: daysAgo(22),
    },
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForConfirmedPO.id,
      event: 'ORDER',
      fromStatus: 'APPROVED',
      toStatus: 'ORDERED',
      actorId: acmeFinance,
      metadata: {},
      publishedAt: daysAgo(20),
      createdAt: daysAgo(20),
    },

    // ── reqForReceivedPO : full trail ─────────────────────────────────────
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForReceivedPO.id,
      event: 'SUBMIT',
      fromStatus: 'DRAFT',
      toStatus: 'SUBMITTED',
      actorId: acmeStaff,
      metadata: {},
      publishedAt: daysAgo(45),
      createdAt: daysAgo(45),
    },
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForReceivedPO.id,
      event: 'APPROVE',
      fromStatus: 'SUBMITTED',
      toStatus: 'APPROVED',
      actorId: acmeOwner,
      metadata: {},
      publishedAt: daysAgo(42),
      createdAt: daysAgo(42),
    },
    {
      organizationId: acme.id,
      entityType: 'REQUISITION',
      entityId: reqForReceivedPO.id,
      event: 'ORDER',
      fromStatus: 'APPROVED',
      toStatus: 'ORDERED',
      actorId: acmeFinance,
      metadata: {},
      publishedAt: daysAgo(42),
      createdAt: daysAgo(42),
    },

    // ── poDraft : no transitions (initial DRAFT state)
    // ORDER event on the PR is the audit trail for PO creation.

    // ── poSent : DRAFT → SENT ────────────────────────────────────────────
    // FINANCE sends PO to supplier
    {
      organizationId: acme.id,
      entityType: 'PURCHASE_ORDER',
      entityId: poSent.id,
      event: 'SEND',
      fromStatus: 'DRAFT',
      toStatus: 'SENT',
      actorId: acmeFinance,
      metadata: {},
      publishedAt: daysAgo(10),
      createdAt: daysAgo(10),
    },

    // ── poConfirmed : DRAFT → SENT → CONFIRMED ───────────────────────────
    // Supplier OWNER confirms
    {
      organizationId: acme.id,
      entityType: 'PURCHASE_ORDER',
      entityId: poConfirmed.id,
      event: 'SEND',
      fromStatus: 'DRAFT',
      toStatus: 'SENT',
      actorId: acmeFinance,
      metadata: {},
      publishedAt: daysAgo(19),
      createdAt: daysAgo(19),
    },
    {
      organizationId: acme.id,
      entityType: 'PURCHASE_ORDER',
      entityId: poConfirmed.id,
      event: 'CONFIRM',
      fromStatus: 'SENT',
      toStatus: 'CONFIRMED',
      actorId: tsOwner,
      metadata: {},
      publishedAt: daysAgo(17),
      createdAt: daysAgo(17),
    },

    // ── poReceived : DRAFT → SENT → CONFIRMED → RECEIVED ─────────────────
    // RECEIVE is system-triggered after goods receipt is saved by STAFF
    {
      organizationId: acme.id,
      entityType: 'PURCHASE_ORDER',
      entityId: poReceived.id,
      event: 'SEND',
      fromStatus: 'DRAFT',
      toStatus: 'SENT',
      actorId: acmeFinance,
      metadata: {},
      publishedAt: daysAgo(41),
      createdAt: daysAgo(41),
    },
    {
      organizationId: acme.id,
      entityType: 'PURCHASE_ORDER',
      entityId: poReceived.id,
      event: 'CONFIRM',
      fromStatus: 'SENT',
      toStatus: 'CONFIRMED',
      actorId: tsOwner,
      metadata: {},
      publishedAt: daysAgo(39),
      createdAt: daysAgo(39),
    },
    {
      organizationId: acme.id,
      entityType: 'PURCHASE_ORDER',
      entityId: poReceived.id,
      event: 'RECEIVE',
      fromStatus: 'CONFIRMED',
      toStatus: 'RECEIVED',
      actorId: acmeStaff, // STAFF receives goods
      metadata: {
        goodsReceiptId: goodsReceipt.id,
        totalReceived: 18,
        totalOrdered: 18,
      },
      publishedAt: daysAgo(30),
      createdAt: daysAgo(30),
    },

    // ── poCancelled : DRAFT → SENT → CANCELLED ────────────────────────────
    // OWNER cancels (OWNER can cancel; FINANCE could too per buyer-side roles)
    // {
    //   organizationId: acme.id,
    //   entityType: 'PURCHASE_ORDER',
    //   entityId: poCancelled.id,
    //   event: 'SEND',
    //   fromStatus: 'DRAFT',
    //   toStatus: 'SENT',
    //   actorId: acmeFinance,
    //   metadata: {},
    //   publishedAt: daysAgo(7),
    //   createdAt: daysAgo(7),
    // },
    // {
    //   organizationId: acme.id,
    //   entityType: 'PURCHASE_ORDER',
    //   entityId: poCancelled.id,
    //   event: 'CANCEL',
    //   fromStatus: 'SENT',
    //   toStatus: 'CANCELLED',
    //   actorId: acmeOwner,
    //   metadata: {
    //     reason: 'Vendor unable to fulfil within required timeframe.',
    //   },
    //   publishedAt: daysAgo(6),
    //   createdAt: daysAgo(6),
    // },
  ];

  await prisma.auditLog.createMany({ data: logs });

  // ── Summary ───────────────────────────────────────────────────────────────
  const allDefs = [
    ...acmeUserDefs.map((d) => ({ ...d, org: 'Acme Corp' })),
    ...tsUserDefs.map((d) => ({ ...d, org: 'TechSupply Inc' })),
  ];

  console.log('\n✅ Seed complete.\n');
  console.log('─'.repeat(74));
  console.log(
    'Email'.padEnd(32) + 'Password'.padEnd(14) + 'Role'.padEnd(12) + 'Org',
  );
  console.log('─'.repeat(74));
  for (const a of allDefs) {
    console.log(
      a.email.padEnd(32) + PASSWORD.padEnd(14) + a.role.padEnd(12) + a.org,
    );
  }
  console.log('─'.repeat(74));

  console.log('\nDocuments seeded:');
  console.log(
    '  Requisitions : 2 DRAFT · 1 SUBMITTED · 2 APPROVED · 1 REJECTED · 4 ORDERED',
  );
  console.log(
    '  POs          : 1 DRAFT · 1 SENT · 1 CONFIRMED · 1 RECEIVED · 1 CANCELLED',
  );
  console.log('  GoodsReceipts: 1 (full receipt for RECEIVED PO)');
  console.log(
    '  Invoices     : 1 SUBMITTED · 1 EXCEPTION · 1 APPROVED · 1 PAID',
  );
  console.log('  Payments     : 1 SUCCESS · 1 PENDING · 1 FAILED');
  console.log(`  Audit logs   : ${logs.length} entries\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
