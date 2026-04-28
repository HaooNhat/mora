import { Actor } from '@mora/api/common/state-machine/types';
import { RedisService } from '@mora/api/services/redis/redis.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationType } from '@prisma/client';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import {
  OrganizationRepository,
  OrganizationWithMemberRole,
} from './organization.repository';

const ACTOR_CACHE_TTL = 300; // 5 minutes

@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly redisService: RedisService,
  ) {}

  async resolveActor(userId: string, orgId: string): Promise<Actor> {
    if (!orgId) {
      throw new NotFoundException('orgId is required.');
    }

    const cacheKey = `actor:${userId}:${orgId}`;
    const cached = await this.redisService.getObject<Actor>(cacheKey);
    if (cached) return cached;

    const member = await this.organizationRepository.findMember(orgId, userId);

    if (!member || !member.isActive) {
      throw new ForbiddenException(
        'You are not a member of this organization.',
      );
    }

    const actor: Actor = { id: userId, role: member.role, orgId };
    await this.redisService.setObject(cacheKey, actor, ACTOR_CACHE_TTL);

    return actor;
  }

  async invalidateActor(userId: string, orgId: string): Promise<void> {
    await this.redisService.del(`actor:${userId}:${orgId}`);
  }

  async getMyOrganizations(
    userId: string,
  ): Promise<OrganizationWithMemberRole[]> {
    return this.organizationRepository.findMyOrganizations(userId);
  }

  async createOrganization(
    dto: CreateOrganizationDto,
    ownerId: string,
  ): Promise<OrganizationWithMemberRole> {
    return this.organizationRepository.create(
      {
        name: dto.name,
        type: dto.type as OrganizationType,
        legalName: dto.legalName,
      },
      ownerId,
    );
  }
}
