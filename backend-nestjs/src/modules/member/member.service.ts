import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { FamilyBranch } from './entities/family-branch.entity';
import { Marriage, MarriageStatus } from './entities/marriage.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageDto } from '../../common/dto/page.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(FamilyBranch)
    private branchRepository: Repository<FamilyBranch>,
  ) {}

  async findAllBranches(): Promise<FamilyBranch[]> {
    const branches = await this.branchRepository.find();

    // Add member count to each branch
    const branchesWithCount = await Promise.all(
      branches.map(async (branch) => {
        const memberCount = await this.memberRepository.count({
          where: { branch: { id: branch.id } },
        });
        return { ...branch, memberCount };
      }),
    );

    return branchesWithCount;
  }

  async findOneBranch(id: string): Promise<FamilyBranch> {
    const branch = await this.branchRepository.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return branch;
  }

  async createBranch(createBranchDto: any): Promise<FamilyBranch> {
    const branch = this.branchRepository.create(createBranchDto);
    const saved = await this.branchRepository.save(branch);
    // TypeORM save can return T | T[], we know it's a single entity
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async updateBranch(id: string, updateBranchDto: any): Promise<FamilyBranch> {
    await this.branchRepository.update(id, updateBranchDto);
    return this.findOneBranch(id);
  }

  async deleteBranch(id: string): Promise<void> {
    // Check if branch has any members
    const memberCount = await this.memberRepository.count({
      where: { branch: { id } },
    });

    if (memberCount > 0) {
      throw new NotFoundException(
        `Cannot delete branch. It has ${memberCount} member(s). Please reassign or delete members first.`,
      );
    }

    await this.branchRepository.delete(id);
  }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Member>> {
    const queryBuilder = this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.father', 'father')
      .leftJoinAndSelect('member.mother', 'mother')
      .leftJoinAndSelect('member.branch', 'branch')
      .leftJoinAndSelect('member.marriagesAsPartner1', 'marriage1')
      .leftJoinAndSelect('marriage1.partner1', 'partner1_marriage1')
      .leftJoinAndSelect('marriage1.partner2', 'partner2_marriage1')
      .leftJoinAndSelect('member.marriagesAsPartner2', 'marriage2')
      .leftJoinAndSelect('marriage2.partner1', 'partner1_marriage2')
      .leftJoinAndSelect('marriage2.partner2', 'partner2_marriage2');

    // Build where conditions
    const whereConditions: string[] = [];
    const whereParams: any = {};

    if (pageOptionsDto.q) {
      whereConditions.push(
        '(member.firstName ILIKE :q OR member.lastName ILIKE :q OR member.fullName ILIKE :q)',
      );
      whereParams.q = `%${pageOptionsDto.q}%`;
    }

    if (pageOptionsDto.branchId) {
      whereConditions.push('branch.id = :branchId');
      whereParams.branchId = pageOptionsDto.branchId;
    }

    if (pageOptionsDto.gender) {
      whereConditions.push('member.gender = :gender');
      whereParams.gender = pageOptionsDto.gender;
    }

    if (
      pageOptionsDto.isAlive !== undefined &&
      pageOptionsDto.isAlive !== null
    ) {
      whereConditions.push('member.isAlive = :isAlive');
      whereParams.isAlive = pageOptionsDto.isAlive;
    }

    // Apply where conditions
    if (whereConditions.length > 0) {
      if (whereConditions.length === 1) {
        queryBuilder.where(whereConditions[0], whereParams);
      } else {
        queryBuilder.where(whereConditions.join(' AND '), whereParams);
      }
    }

    queryBuilder
      .orderBy('member.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    // Add children count and formatted data to each member
    const membersWithCounts = await Promise.all(
      entities.map(async (member) => {
        const childrenCount = await this.memberRepository.count({
          where: [{ father: { id: member.id } }, { mother: { id: member.id } }],
        });

        // Get spouse from marriages - try active marriages first, then any marriage
        let spouse = null;
        const marriages1 = member.marriagesAsPartner1 || [];
        const marriages2 = member.marriagesAsPartner2 || [];

        // Get active marriages (status = MARRIED)
        const activeMarriage1 = marriages1.find(
          (m: Marriage) => m.status === MarriageStatus.MARRIED,
        );
        const activeMarriage2 = marriages2.find(
          (m: Marriage) => m.status === MarriageStatus.MARRIED,
        );

        if (activeMarriage1 && activeMarriage1.partner2) {
          spouse = activeMarriage1.partner2;
        } else if (activeMarriage2 && activeMarriage2.partner1) {
          spouse = activeMarriage2.partner1;
        } else if (marriages1.length > 0 && marriages1[0].partner2) {
          spouse = marriages1[0].partner2;
        } else if (marriages2.length > 0 && marriages2[0].partner1) {
          spouse = marriages2[0].partner1;
        }

        // Format generation
        const generation = member.generationIndex
          ? `Đời ${member.generationIndex}`
          : null;

        // Format branch - prioritize branch.name, then format from branchOrder
        let branchDisplay = null;
        if (member.branch) {
          // Always use branch.name if it exists and is not empty
          if (member.branch.name && member.branch.name.trim() !== '') {
            branchDisplay = member.branch.name;
          } else {
            // Otherwise, format from branchOrder
            const branchOrder = member.branch.branchOrder || 1;
            const isTrưởng = member.branch.isTrưởng;
            branchDisplay = isTrưởng
              ? `Chi ${branchOrder} (Trưởng)`
              : `Chi ${branchOrder}`;
          }
        }

        // Format birth year
        const birthYear = member.dateOfBirth
          ? new Date(member.dateOfBirth).getFullYear()
          : null;

        return {
          ...member,
          childrenCount,
          spouse,
          generation,
          branchDisplay,
          birthYear,
        };
      }),
    );

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(membersWithCounts, pageMetaDto);
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
      relations: [
        'father',
        'mother',
        'marriagesAsPartner1',
        'marriagesAsPartner1.partner1',
        'marriagesAsPartner1.partner2',
        'marriagesAsPartner2',
        'marriagesAsPartner2.partner1',
        'marriagesAsPartner2.partner2',
        'branch',
      ],
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }
    return member;
  }

  async create(createMemberDto: CreateMemberDto): Promise<Member> {
    const memberData: any = {
      ...createMemberDto,
    };

    // Handle relations
    if (createMemberDto.fatherId) {
      memberData.father = { id: createMemberDto.fatherId };
    }
    if (createMemberDto.motherId) {
      memberData.mother = { id: createMemberDto.motherId };
    }
    if (createMemberDto.branchId) {
      memberData.branch = { id: createMemberDto.branchId };
    }

    // Remove ID fields from data to avoid conflicts if they are not in entity columns directly (though they are not)
    delete memberData.fatherId;
    delete memberData.motherId;
    delete memberData.branchId;

    const member = this.memberRepository.create(
      memberData,
    ) as unknown as Member;

    // Generate slug
    member.slug = `${createMemberDto.firstName}-${Date.now()}`.toLowerCase();
    member.fullName =
      `${createMemberDto.lastName || ''} ${createMemberDto.middleName || ''} ${createMemberDto.firstName}`.trim();

    return this.memberRepository.save(member);
  }

  async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
    const member = await this.findOne(id);
    Object.assign(member, updateMemberDto);
    if (
      updateMemberDto.firstName ||
      updateMemberDto.lastName ||
      updateMemberDto.middleName
    ) {
      member.fullName =
        `${member.lastName || ''} ${member.middleName || ''} ${member.firstName}`.trim();
    }
    return this.memberRepository.save(member);
  }

  async remove(id: string): Promise<void> {
    // Check if member has children
    const childrenCount = await this.memberRepository.count({
      where: [{ father: { id } }, { mother: { id } }],
    });

    if (childrenCount > 0) {
      throw new NotFoundException(
        `Cannot delete member. This member has ${childrenCount} child(ren). Please remove or reassign children first.`,
      );
    }

    // Check if member is in any marriages
    const member = await this.memberRepository.findOne({
      where: { id },
      relations: ['marriagesAsPartner1', 'marriagesAsPartner2'],
    });

    if (
      member &&
      (member.marriagesAsPartner1?.length > 0 ||
        member.marriagesAsPartner2?.length > 0)
    ) {
      throw new NotFoundException(
        'Cannot delete member. This member has marriage records. Please delete marriages first.',
      );
    }

    await this.memberRepository.delete(id);
  }
}
