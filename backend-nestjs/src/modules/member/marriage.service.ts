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
      'marriagesAsPartner1.partner1',
      'marriagesAsPartner1.partner2',
      'marriagesAsPartner2',
      'marriagesAsPartner2.partner1',
      'marriagesAsPartner2.partner2',
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

    const getActiveMarriages = (
      member: Member,
      includeDivorced: boolean = false,
    ) => {
      // Include WIDOWED so we can close it when remarrying - REMOVED per user request
      const validStatuses = [MarriageStatus.MARRIED];
      if (includeDivorced) {
        validStatuses.push(MarriageStatus.DIVORCED);
      }

      const m1 = (member.marriagesAsPartner1 || []).filter(
        (m) => validStatuses.includes(m.status) && !m.endDate,
      );
      const m2 = (member.marriagesAsPartner2 || []).filter(
        (m) => validStatuses.includes(m.status) && !m.endDate,
      );
      return [...m1, ...m2];
    };

    // User explicitly sets status to SINGLE (e.g. Divorce request but using SINGLE status)
    if (status === MarriageStatus.SINGLE) {
      const activeMarriages = getActiveMarriages(p1);
      for (const m of activeMarriages) {
        m.endDate = date;
        // We could update status to DIVORCED here if we wanted strict tracking
        await this.marriageRepository.save(m);
      }
      return null as any;
    }

    if (status === MarriageStatus.DIVORCED) {
      if (finalP2) {
        // Find the specific marriage record between these two partners
        // We look for the LATEST record regardless of whether it has an endDate (to allow corrections)
        const allMarriages = [
          ...(finalP1.marriagesAsPartner1 || []),
          ...(finalP1.marriagesAsPartner2 || []),
        ];

        const targetMarriage = allMarriages
          .filter(
            (m) =>
              (m.partner1?.id === finalP1.id &&
                m.partner2?.id === finalP2.id) ||
              (m.partner1?.id === finalP2.id && m.partner2?.id === finalP1.id),
          )
          .sort(
            (a, b) =>
              new Date(b.startDate || 0).getTime() -
              new Date(a.startDate || 0).getTime(),
          )[0];

        if (targetMarriage) {
          // Validate divorce date against marriage date
          const divorceDate = startDate ? new Date(startDate) : new Date(); // Input date
          const marriageDate = targetMarriage.startDate
            ? new Date(targetMarriage.startDate)
            : null;

          // Validate if marriageDate exists
          if (marriageDate) {
            // Reset times to midnight for accurate date-only comparison
            const dTime = new Date(divorceDate).setHours(0, 0, 0, 0);
            const mTime = new Date(marriageDate).setHours(0, 0, 0, 0);

            if (dTime <= mTime) {
              throw new BadRequestException(
                'Ngày ly hôn phải sau ngày kết hôn (Divorce date must be after marriage date)',
              );
            }
          }

          targetMarriage.status = status as MarriageStatus;
          // CORRECT LOGIC: Divorce Date ends the marriage. Start Date remains the Marriage Date.
          targetMarriage.endDate = divorceDate;
          if (rest.notes) targetMarriage.notes = rest.notes;
          return this.marriageRepository.save(targetMarriage);
        } else {
          // If no marriage record matches
          throw new BadRequestException(
            'Cannot divorce: No marriage record found between these partners (Không tìm thấy kết hôn)',
          );
        }
      }
    }

    /* 
     REMOVED WIDOWED LOGIC
    if (status === MarriageStatus.WIDOWED) {
       ...
    }
    */

    if (status === MarriageStatus.MARRIED) {
      const activeMarriagesP1 = getActiveMarriages(finalP1);
      const activeMarriagesP2 = finalP2 ? getActiveMarriages(finalP2) : [];
      const allActive = new Set([...activeMarriagesP1, ...activeMarriagesP2]);

      for (const m of allActive) {
        // If the previous status was WIDOWED, we close it because they are now Remarrying.
        /* 
        if (m.status === MarriageStatus.WIDOWED) {
          m.endDate = date;
          await this.marriageRepository.save(m);
        }
        */
        // Note: We do NOT automatically close concurrent MARRIED records here
        // unless specifically required (Polygamy support).
        // If Monogamy is strict, we would close them too.
        // But user flow "MARRIED --divorce--> SINGLE" implies divorce is explicit.
      }
    }

    // If we're here, it means we are creating a new marriage record.
    // Per user request, Divorce/Widowed dates map to startDate.
    const marriage = this.marriageRepository.create({
      partner1: finalP1,
      partner2: finalP2,
      status: status as MarriageStatus,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: undefined, // Always map input to start per request
      ...rest,
    });
    return this.marriageRepository.save(marriage);
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

    if (updateMarriageDto.status !== undefined) {
      marriage.status = updateMarriageDto.status as MarriageStatus;
    }

    if (updateMarriageDto.startDate !== undefined) {
      marriage.startDate = updateMarriageDto.startDate
        ? new Date(updateMarriageDto.startDate)
        : null;
    }

    if (updateMarriageDto.endDate !== undefined) {
      marriage.endDate = updateMarriageDto.endDate
        ? new Date(updateMarriageDto.endDate)
        : null;
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
