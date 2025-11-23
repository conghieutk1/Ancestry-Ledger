import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';

@Injectable()
export class GenealogyService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  /**
   * Kiểm tra xem 2 người có phải anh em ruột không
   * Anh em ruột: Cùng cha hoặc cùng mẹ
   */
  async areSiblings(memberId1: string, memberId2: string): Promise<boolean> {
    const member1 = await this.memberRepository.findOne({
      where: { id: memberId1 },
      relations: ['father', 'mother'],
    });
    const member2 = await this.memberRepository.findOne({
      where: { id: memberId2 },
      relations: ['father', 'mother'],
    });

    if (!member1 || !member2) return false;

    // Cùng cha
    if (member1.father?.id && member1.father.id === member2.father?.id) {
      return true;
    }
    // Cùng mẹ
    if (member1.mother?.id && member1.mother.id === member2.mother?.id) {
      return true;
    }

    return false;
  }

  /**
   * Kiểm tra xem B có phải con/cháu/... của A không (descendant)
   */
  async isDescendant(
    potentialAncestorId: string,
    memberId: string,
    visited: Set<string> = new Set(),
  ): Promise<boolean> {
    if (visited.has(memberId)) {
      return false;
    }
    visited.add(memberId);

    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: ['father', 'mother'],
    });

    if (!member) return false;

    if (member.father?.id === potentialAncestorId) return true;
    if (member.mother?.id === potentialAncestorId) return true;

    if (member.father?.id) {
      if (
        await this.isDescendant(
          potentialAncestorId,
          member.father.id,
          visited,
        )
      ) {
        return true;
      }
    }
    if (member.mother?.id) {
      if (
        await this.isDescendant(
          potentialAncestorId,
          member.mother.id,
          visited,
        )
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Tính khoảng cách huyết thống
   */
  async getConsanguinityDistance(
    memberId1: string,
    memberId2: string,
  ): Promise<number> {
    if (await this.areSiblings(memberId1, memberId2)) {
      return 1;
    }

    const member1 = await this.memberRepository.findOne({
      where: { id: memberId1 },
      relations: ['father', 'mother'],
    });
    const member2 = await this.memberRepository.findOne({
      where: { id: memberId2 },
      relations: ['father', 'mother'],
    });

    if (!member1 || !member2) return -1;

    if (member1.father?.id === memberId2 || member1.mother?.id === memberId2) {
      return 0;
    }
    if (member2.father?.id === memberId1 || member2.mother?.id === memberId1) {
      return 0;
    }

    const father1Siblings = member1.father?.id
      ? await this.getSiblings(member1.father.id)
      : [];
    const mother1Siblings = member1.mother?.id
      ? await this.getSiblings(member1.mother.id)
      : [];

    if (
      father1Siblings.some((s) => s.id === memberId2) ||
      mother1Siblings.some((s) => s.id === memberId2)
    ) {
      return 2;
    }

    return -1;
  }

  /**
   * Lấy tất cả anh em ruột
   */
  private async getSiblings(memberId: string): Promise<Member[]> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: ['father', 'mother'],
    });

    if (!member) return [];

    const siblings: Member[] = [];

    if (member.father?.id) {
      const fathersChildren = await this.memberRepository.find({
        where: { father: { id: member.father.id } },
      });
      siblings.push(...fathersChildren);
    }

    if (member.mother?.id) {
      const mothersChildren = await this.memberRepository.find({
        where: { mother: { id: member.mother.id } },
      });
      siblings.push(...mothersChildren);
    }

    const uniqueSiblings = Array.from(
      new Map(siblings.map((s) => [s.id, s])).values(),
    ).filter((s) => s.id !== memberId);

    return uniqueSiblings;
  }

  /**
   * Lấy mối quan hệ huyết thống
   */
  async getRelationshipType(
    memberId1: string,
    memberId2: string,
  ): Promise<string> {
    const isSibling = await this.areSiblings(memberId1, memberId2);
    if (isSibling) return 'Anh em ruột';

    const isDesc1to2 = await this.isDescendant(memberId1, memberId2);
    if (isDesc1to2) return 'Tổ tiên của partner2';

    const isDesc2to1 = await this.isDescendant(memberId2, memberId1);
    if (isDesc2to1) return 'Tổ tiên của partner1';

    const distance = await this.getConsanguinityDistance(memberId1, memberId2);
    switch (distance) {
      case 1:
        return 'Anh em ruột';
      case 2:
        return 'Chú/Cô/Bác';
      case 3:
        return 'Em họ cùng ông bà';
      default:
        return 'Không có liên hệ huyết thống gần';
    }
  }
}
