import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto } from './dto';
import { GroupRole } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGroupDto, userId: string) {
    return this.prisma.group.create({
      data: {
        name: dto.name,
        emoji: dto.emoji,
        members: {
          create: {
            userId,
            role: GroupRole.ADMIN,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async findAllForUser(userId: string) {
    return this.prisma.group.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            messages: true,
            events: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is a member
    const isMember = group.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return group;
  }

  async update(id: string, dto: UpdateGroupDto, userId: string) {
    await this.ensureAdmin(id, userId);

    return this.prisma.group.update({
      where: { id },
      data: {
        name: dto.name,
        emoji: dto.emoji,
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async addMember(groupId: string, dto: AddMemberDto, requesterId: string) {
    await this.ensureAdmin(groupId, requesterId);

    // Check if user to add exists
    const userToAdd = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!userToAdd) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already a member
    const existingMember = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: dto.userId,
          groupId,
        },
      },
    });

    if (existingMember) {
      throw new ForbiddenException('User is already a member of this group');
    }

    return this.prisma.groupMember.create({
      data: {
        userId: dto.userId,
        groupId,
        role: dto.role || GroupRole.MEMBER,
      },
      include: {
        user: true,
        group: true,
      },
    });
  }

  async removeMember(groupId: string, targetUserId: string, requesterId: string) {
    await this.ensureAdmin(groupId, requesterId);

    // Check if trying to remove self
    if (targetUserId === requesterId) {
      // Count admins in group
      const adminCount = await this.prisma.groupMember.count({
        where: {
          groupId,
          role: GroupRole.ADMIN,
        },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException(
          'Cannot remove yourself as the last admin',
        );
      }
    }

    // Check if member exists
    const member = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this group');
    }

    await this.prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: targetUserId,
          groupId,
        },
      },
    });

    return { success: true };
  }

  private async ensureAdmin(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Group not found or you are not a member');
    }

    if (member.role !== GroupRole.ADMIN) {
      throw new ForbiddenException('Only admins can perform this action');
    }
  }
}
