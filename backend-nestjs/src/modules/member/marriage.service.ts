import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Marriage } from './entities/marriage.entity';
import { Member } from './entities/member.entity';
import { CreateMarriageDto } from './dto/create-marriage.dto';
import { UpdateMarriageDto } from './dto/update-marriage.dto';

@Injectable()
export class MarriageService {
  constructor(
    @InjectRepository(Marriage)
    private marriageRepository: Repository<Marriage>,
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
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
    const { partner1Id, partner2Id, ...rest } = createMarriageDto;

    // Validate partner1
    const partner1 = await this.memberRepository.findOne({
      where: { id: partner1Id },
    });
    if (!partner1)
      throw new NotFoundException(`Member with ID ${partner1Id} not found`);

    // Partner2 is optional (for DIVORCED, WIDOWED statuses)
    let partner2 = null;
    if (partner2Id) {
      if (partner1Id === partner2Id) {
        throw new BadRequestException('Partners must be different members');
      }

      partner2 = await this.memberRepository.findOne({
        where: { id: partner2Id },
      });
      if (!partner2)
        throw new NotFoundException(`Member with ID ${partner2Id} not found`);
    }

    const marriage = this.marriageRepository.create({
      ...rest,
      partner1,
      partner2,
    });

    return this.marriageRepository.save(marriage);
  }

  async update(
    id: string,
    updateMarriageDto: UpdateMarriageDto,
  ): Promise<Marriage> {
    const marriage = await this.findOne(id);

    // Handle partner updates if necessary, though usually we don't change partners in an update
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

    Object.assign(marriage, updateMarriageDto);

    // Remove IDs from object to avoid overwriting relations with strings if they were passed
    delete (marriage as any).partner1Id;
    delete (marriage as any).partner2Id;

    return this.marriageRepository.save(marriage);
  }

  async remove(id: string): Promise<void> {
    const result = await this.marriageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Marriage with ID ${id} not found`);
    }
  }
}
