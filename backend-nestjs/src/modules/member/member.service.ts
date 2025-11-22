import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
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
  ) {}

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Member>> {
    const queryBuilder = this.memberRepository.createQueryBuilder('member');

    queryBuilder
      .orderBy('member.createdAt', pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take);

    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
      relations: [
        'father',
        'mother',
        'marriagesAsPartner1',
        'marriagesAsPartner2',
      ],
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }
    return member;
  }

  async create(createMemberDto: CreateMemberDto): Promise<Member> {
    const member = this.memberRepository.create(createMemberDto);
    // Generate slug logic here (simplified)
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
    const member = await this.findOne(id);
    await this.memberRepository.remove(member);
  }
}
