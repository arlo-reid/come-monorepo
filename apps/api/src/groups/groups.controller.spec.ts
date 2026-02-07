import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

describe('GroupsController', () => {
  let controller: GroupsController;
  let service: GroupsService;

  const mockUser = { id: 'user-1', phone: '+1234567890' };
  const mockRequest = { user: mockUser } as any;

  const mockGroup = {
    id: 'group-1',
    name: 'Test Group',
    emoji: '🎉',
    createdAt: new Date(),
    members: [
      {
        userId: 'user-1',
        groupId: 'group-1',
        role: 'ADMIN',
        joinedAt: new Date(),
        user: mockUser,
      },
    ],
  };

  const mockGroupsService = {
    create: jest.fn(),
    findAllForUser: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [
        {
          provide: GroupsService,
          useValue: mockGroupsService,
        },
      ],
    }).compile();

    controller = module.get<GroupsController>(GroupsController);
    service = module.get<GroupsService>(GroupsService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a group with user as admin', async () => {
      const createDto = { name: 'New Group', emoji: '🚀' };
      mockGroupsService.create.mockResolvedValue(mockGroup);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.id);
      expect(result).toEqual(mockGroup);
    });

    it('should create a group without emoji', async () => {
      const createDto = { name: 'New Group' };
      const groupWithoutEmoji = { ...mockGroup, emoji: null };
      mockGroupsService.create.mockResolvedValue(groupWithoutEmoji);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, mockUser.id);
      expect(result.emoji).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all groups for the user', async () => {
      const groups = [mockGroup];
      mockGroupsService.findAllForUser.mockResolvedValue(groups);

      const result = await controller.findAll(mockRequest);

      expect(service.findAllForUser).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(groups);
    });

    it('should return empty array if user has no groups', async () => {
      mockGroupsService.findAllForUser.mockResolvedValue([]);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a group by id', async () => {
      mockGroupsService.findOne.mockResolvedValue(mockGroup);

      const result = await controller.findOne('group-1', mockRequest);

      expect(service.findOne).toHaveBeenCalledWith('group-1', mockUser.id);
      expect(result).toEqual(mockGroup);
    });

    it('should throw NotFoundException for non-existent group', async () => {
      mockGroupsService.findOne.mockRejectedValue(
        new NotFoundException('Group not found'),
      );

      await expect(
        controller.findOne('non-existent', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockGroupsService.findOne.mockRejectedValue(
        new ForbiddenException('You are not a member of this group'),
      );

      await expect(controller.findOne('group-1', mockRequest)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update a group (admin only)', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedGroup = { ...mockGroup, name: 'Updated Name' };
      mockGroupsService.update.mockResolvedValue(updatedGroup);

      const result = await controller.update('group-1', updateDto, mockRequest);

      expect(service.update).toHaveBeenCalledWith(
        'group-1',
        updateDto,
        mockUser.id,
      );
      expect(result.name).toBe('Updated Name');
    });

    it('should throw ForbiddenException if not admin', async () => {
      const updateDto = { name: 'Updated Name' };
      mockGroupsService.update.mockRejectedValue(
        new ForbiddenException('Only admins can perform this action'),
      );

      await expect(
        controller.update('group-1', updateDto, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addMember', () => {
    it('should add a member to the group (admin only)', async () => {
      const addMemberDto = { userId: 'user-2' };
      const newMember = {
        userId: 'user-2',
        groupId: 'group-1',
        role: 'MEMBER',
        joinedAt: new Date(),
        user: { id: 'user-2', phone: '+9876543210' },
        group: mockGroup,
      };
      mockGroupsService.addMember.mockResolvedValue(newMember);

      const result = await controller.addMember(
        'group-1',
        addMemberDto,
        mockRequest,
      );

      expect(service.addMember).toHaveBeenCalledWith(
        'group-1',
        addMemberDto,
        mockUser.id,
      );
      expect(result.userId).toBe('user-2');
    });

    it('should add a member with specific role', async () => {
      const addMemberDto = { userId: 'user-2', role: 'ADMIN' as const };
      const newMember = {
        userId: 'user-2',
        groupId: 'group-1',
        role: 'ADMIN',
        joinedAt: new Date(),
        user: { id: 'user-2', phone: '+9876543210' },
        group: mockGroup,
      };
      mockGroupsService.addMember.mockResolvedValue(newMember);

      const result = await controller.addMember(
        'group-1',
        addMemberDto,
        mockRequest,
      );

      expect(result.role).toBe('ADMIN');
    });

    it('should throw ForbiddenException if not admin', async () => {
      const addMemberDto = { userId: 'user-2' };
      mockGroupsService.addMember.mockRejectedValue(
        new ForbiddenException('Only admins can perform this action'),
      );

      await expect(
        controller.addMember('group-1', addMemberDto, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user to add does not exist', async () => {
      const addMemberDto = { userId: 'non-existent' };
      mockGroupsService.addMember.mockRejectedValue(
        new NotFoundException('User not found'),
      );

      await expect(
        controller.addMember('group-1', addMemberDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMember', () => {
    it('should remove a member from the group (admin only)', async () => {
      mockGroupsService.removeMember.mockResolvedValue({ success: true });

      const result = await controller.removeMember(
        'group-1',
        'user-2',
        mockRequest,
      );

      expect(service.removeMember).toHaveBeenCalledWith(
        'group-1',
        'user-2',
        mockUser.id,
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw ForbiddenException if not admin', async () => {
      mockGroupsService.removeMember.mockRejectedValue(
        new ForbiddenException('Only admins can perform this action'),
      );

      await expect(
        controller.removeMember('group-1', 'user-2', mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if member not found', async () => {
      mockGroupsService.removeMember.mockRejectedValue(
        new NotFoundException('Member not found in this group'),
      );

      await expect(
        controller.removeMember('group-1', 'non-existent', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when last admin tries to leave', async () => {
      mockGroupsService.removeMember.mockRejectedValue(
        new ForbiddenException('Cannot remove yourself as the last admin'),
      );

      await expect(
        controller.removeMember('group-1', 'user-1', mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
