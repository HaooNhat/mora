import { PrismaService } from '@mora/api/services/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  Organization,
  OrganizationMember,
  OrganizationRole,
} from '@prisma/client';

export type OrganizationWithMemberRole = Organization & {
  role: OrganizationRole;
};

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    return this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
  }

  async findMyOrganizations(
    userId: string,
  ): Promise<OrganizationWithMemberRole[]> {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId, isActive: true },
      include: { organization: true },
      orderBy: { joinedAt: 'asc' },
    });

    return memberships
      .filter((m) => m.organization.isActive)
      .map((m) => ({ ...m.organization, role: m.role }));
  }

  async create(
    data: {
      name: string;
      type: import('@prisma/client').OrganizationType;
      legalName?: string;
    },
    ownerId: string,
  ): Promise<OrganizationWithMemberRole> {
    const org = await this.prisma.organization.create({
      data: {
        name: data.name,
        type: data.type,
        legalName: data.legalName,
        members: {
          create: {
            userId: ownerId,
            role: OrganizationRole.OWNER,
            isPrimary: true,
            isActive: true,
          },
        },
      },
    });

    return { ...org, role: OrganizationRole.OWNER };
  }
}
