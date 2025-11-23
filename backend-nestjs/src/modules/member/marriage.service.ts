import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marriage, MarriageStatus } from './entities/marriage.entity';
import { Member } from './entities/member.entity';
import { CreateMarriageDto } from './dto/create-marriage.dto';
import { UpdateMarriageDto } from './dto/update-marriage.dto';
import { Gender } from './entities/member.entity';
import { GenealogyService } from './genealogy.service';
import { GenealogyConfig } from './genealogy.config';

@Injectable()
export class MarriageService {
  constructor(
    @InjectRepository(Marriage)
    private marriageRepository: Repository<Marriage>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    private genealogyService: GenealogyService,
  ) {}

  async findAll(): Promise<Marriage[]> {
    return this.marriageRepository.find({
      relations: ['partner1', 'partner2'],
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Marriage> {
    const marriage = await this.marriageRepository.findOne({
      where: { id },
      relations: ['partner1', 'partner2'],
    });
    if (!marriage) {
      throw new NotFoundException(`Marriage with ID ${id} not found`);
    }
    return marriage;
  }

  async create(createMarriageDto: CreateMarriageDto): Promise<Marriage> {
    const { partner1Id, partner2Id, status, startDate, ...rest } =
      createMarriageDto;

    const relations = [
      'marriagesAsPartner1',
      'marriagesAsPartner1.partner2',
      'marriagesAsPartner2',
      'marriagesAsPartner2.partner1',
    ];

    const p1 = await this.memberRepository.findOne({
      where: { id: partner1Id },
      relations,
    });
    if (!p1)
      throw new NotFoundException(`Member with ID ${partner1Id} not found`);

    let p2 = null;
    if (partner2Id) {
      if (partner1Id === partner2Id) {
        throw new BadRequestException('Partners must be different members');
      }
      p2 = await this.memberRepository.findOne({
        where: { id: partner2Id },
        relations,
      });
      if (!p2)
        throw new NotFoundException(`Member with ID ${partner2Id} not found`);

      // Validate blood relation - check for siblings
      const areSiblings = await this.genealogyService.areSiblings(
        partner1Id,
        partner2Id,
      );
      if (areSiblings) {
        throw new BadRequestException({
          message: 'Cannot marry close relatives',
          error: 'FORBIDDEN_MARRIAGE',
          relationshipKey: 'siblings',
          distance: 2,
          limit: GenealogyConfig.FORBIDDEN_GENERATION_LIMIT,
        });
      }

      // Check ancestor-descendant relationship
      const p1IsAncestorOfP2 = await this.genealogyService.isDescendant(
        partner1Id,
        partner2Id,
      );
      const p2IsAncestorOfP1 = await this.genealogyService.isDescendant(
        partner2Id,
        partner1Id,
      );

      if (p1IsAncestorOfP2 || p2IsAncestorOfP1) {
        throw new BadRequestException(
          'Cannot marry ancestors and descendants - Genealogical restriction (Không được kết hôn với tổ tiên/hậu duệ)',
        );
      }

      // Check consanguinity distance
      const distance = await this.genealogyService.getConsanguinityDistance(
        partner1Id,
        partner2Id,
      );
      if (
        distance !== -1 &&
        distance <= GenealogyConfig.FORBIDDEN_GENERATION_LIMIT
      ) {
        // Map distance to relationship key for frontend translation
        let relationshipKey = 'unknown';
        if (distance === 2) relationshipKey = 'siblings';
        else if (distance === 3) relationshipKey = 'uncleAuntNephewNiece';
        else if (distance === 4) relationshipKey = 'firstCousins';
        else if (distance === 5) relationshipKey = 'distantRelative5';
        else if (distance === 6) relationshipKey = 'distantRelative6';

        throw new BadRequestException({
          message: 'Cannot marry close relatives',
          error: 'FORBIDDEN_MARRIAGE',
          relationshipKey: relationshipKey,
          distance: distance,
          limit: GenealogyConfig.FORBIDDEN_GENERATION_LIMIT,
        });
      }
    }

    // Determine final Partner1 (Male) and Partner2 (Female)
    let finalP1 = p1;
    let finalP2 = p2;

    if (p2) {
      // Logic to enforce partner1 = Male, partner2 = Female
      const isP1Male = p1.gender === Gender.MALE;
      const isP1Female = p1.gender === Gender.FEMALE;
      const isP2Male = p2.gender === Gender.MALE;
      const isP2Female = p2.gender === Gender.FEMALE;

      if (isP1Female && isP2Male) {
        // Swap
        finalP1 = p2;
        finalP2 = p1;
      } else if (isP1Male && isP2Female) {
        // Keep
      } else if (isP1Female && isP2Female) {
        throw new BadRequestException(
          'Marriage must be between a Male and a Female (Genealogy convention)',
        );
      } else if (isP1Male && isP2Male) {
        throw new BadRequestException(
          'Marriage must be between a Male and a Female (Genealogy convention)',
        );
      } else {
        // Handle Unknown/Other cases
        // If p1 is Female, swap (assuming p2 is Male/Unknown)
        if (isP1Female) {
          finalP1 = p2;
          finalP2 = p1;
        }
        // If p2 is Male, swap (assuming p1 is Unknown)
        else if (isP2Male) {
          finalP1 = p2;
          finalP2 = p1;
        }
      }
    }

    const date = startDate ? new Date(startDate) : new Date();

    // Validate Age
    const calculateAge = (dob: Date, targetDate: Date) => {
      const ageDifMs = targetDate.getTime() - dob.getTime();
      const ageDate = new Date(ageDifMs); // miliseconds from epoch
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    if (finalP1.dateOfBirth) {
      const age = calculateAge(new Date(finalP1.dateOfBirth), date);
      if (age < GenealogyConfig.MIN_AGE_MALE) {
        throw new BadRequestException({
          message: 'Partner does not meet minimum age requirement',
          error: 'AGE_REQUIREMENT',
          gender: 'MALE',
          minAge: GenealogyConfig.MIN_AGE_MALE,
          currentAge: age,
        });
      }
    }

    if (finalP2 && finalP2.dateOfBirth) {
      const age = calculateAge(new Date(finalP2.dateOfBirth), date);
      if (age < GenealogyConfig.MIN_AGE_FEMALE) {
        throw new BadRequestException({
          message: 'Partner does not meet minimum age requirement',
          error: 'AGE_REQUIREMENT',
          gender: 'FEMALE',
          minAge: GenealogyConfig.MIN_AGE_FEMALE,
          currentAge: age,
        });
      }
    }

    const getActiveMarriages = (member: Member) => {
      const m1 = (member.marriagesAsPartner1 || []).filter(
        (m) => m.status === MarriageStatus.MARRIED && !m.endDate,
      );
      const m2 = (member.marriagesAsPartner2 || []).filter(
        (m) => m.status === MarriageStatus.MARRIED && !m.endDate,
      );
      return [...m1, ...m2];
    };

    if (status === MarriageStatus.SINGLE) {
      const activeMarriages = getActiveMarriages(p1);
      for (const m of activeMarriages) {
        m.endDate = date;
        await this.marriageRepository.save(m);
      }

      if (p1.gender === Gender.MALE) {
        const marriage = this.marriageRepository.create({
          partner1: p1,
          status: MarriageStatus.SINGLE,
          startDate: date,
          ...rest,
        });
        return this.marriageRepository.save(marriage);
      }

      return null as any;
    }

    if (
      status === MarriageStatus.DIVORCED ||
      status === MarriageStatus.WIDOWED
    ) {
      if (finalP2) {
        const activeMarriages = getActiveMarriages(finalP1);
        const targetMarriage = activeMarriages.find(
          (m) => m.partner1.id === finalP1.id && m.partner2?.id === finalP2.id,
        );

        if (targetMarriage) {
          targetMarriage.status = status as MarriageStatus;
          targetMarriage.endDate = startDate ? new Date(startDate) : new Date();
          if (rest.notes) targetMarriage.notes = rest.notes;
          return this.marriageRepository.save(targetMarriage);
        }
      }
    }

    if (status === MarriageStatus.MARRIED) {
      const activeMarriagesP1 = getActiveMarriages(finalP1);
      const activeMarriagesP2 = finalP2 ? getActiveMarriages(finalP2) : [];

      const allActive = new Set([...activeMarriagesP1, ...activeMarriagesP2]);

      for (const m of allActive) {
        m.endDate = date;
        await this.marriageRepository.save(m);
      }
    }

    const marriage = this.marriageRepository.create({
      partner1: finalP1,
      partner2: finalP2,
      status: status as MarriageStatus,
      startDate: startDate ? new Date(startDate) : undefined,
      ...rest,
    });

    return this.marriageRepository.save(marriage); // Handle partner updates if necessary, though usually we don't change partners in an update
  }

  async update(
    id: string,
    updateMarriageDto: UpdateMarriageDto,
  ): Promise<Marriage> {
    const marriage = await this.findOne(id);

    if (updateMarriageDto.partner1Id) {
      const p1 = await this.memberRepository.findOne({
        where: { id: updateMarriageDto.partner1Id },
      });
      if (!p1)
        throw new NotFoundException(
          `Member with ID ${updateMarriageDto.partner1Id} not found`,
        );
      marriage.partner1 = p1;
    }

    if (updateMarriageDto.partner2Id) {
      const p2 = await this.memberRepository.findOne({
        where: { id: updateMarriageDto.partner2Id },
      });
      if (!p2)
        throw new NotFoundException(
          `Member with ID ${updateMarriageDto.partner2Id} not found`,
        );
      marriage.partner2 = p2;
    }

    if (updateMarriageDto.status) {
      marriage.status = updateMarriageDto.status as MarriageStatus;
    }

    if (updateMarriageDto.startDate) {
      marriage.startDate = new Date(updateMarriageDto.startDate);
    }

    if (updateMarriageDto.endDate) {
      marriage.endDate = new Date(updateMarriageDto.endDate);
    }

    if (updateMarriageDto.notes) {
      marriage.notes = updateMarriageDto.notes;
    }

    // return this.marr// iageRepository.
    // save(const marriage = await this.findOne(id);
    // await this.marriageRepository.remove(marriage);marriage);
    return this.marriageRepository.save(marriage);
  }

  async remove(id: string): Promise<void> {
    // const result = await this.marriageRepository.delete(id);
    // if (result.affected === 0) {
    //   throw new NotFoundException(`Marriage with ID ${id} not found`);
    // }
    const marriage = await this.findOne(id);
    await this.marriageRepository.remove(marriage);
  }
}
