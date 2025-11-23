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
   * A is ancestor, B is descendant
   */
  async isDescendant(
    ancestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    if (ancestorId === descendantId) return false;

    const ancestors = await this.getAncestors(descendantId);
    return ancestors.has(ancestorId);
  }

  /**
   * Tính khoảng cách huyết thống (Degree of relationship)
   * Returns -1 if no relationship found within limit.
   */
  async getConsanguinityDistance(
    memberId1: string,
    memberId2: string,
  ): Promise<number> {
    if (memberId1 === memberId2) return 0;

    const ancestors1 = await this.getAncestors(memberId1);
    const ancestors2 = await this.getAncestors(memberId2);

    let minDegree = Infinity;

    // Check direct relationship (ancestor/descendant)
    if (ancestors1.has(memberId2)) return ancestors1.get(memberId2)!;
    if (ancestors2.has(memberId1)) return ancestors2.get(memberId1)!;

    // Find Common Ancestors
    for (const [ancestorId, dist1] of ancestors1.entries()) {
      if (ancestors2.has(ancestorId)) {
        const dist2 = ancestors2.get(ancestorId)!;
        const degree = dist1 + dist2;
        if (degree < minDegree) {
          minDegree = degree;
        }
      }
    }

    return minDegree === Infinity ? -1 : minDegree;
  }

  /**
   * Helper: Get all ancestors with their distance (generation steps up)
   * Returns Map<MemberId, Distance>
   */
  private async getAncestors(
    memberId: string,
    maxDepth: number = 5,
  ): Promise<Map<string, number>> {
    const ancestors = new Map<string, number>();
    const queue: { id: string; dist: number }[] = [{ id: memberId, dist: 0 }];
    const visited = new Set<string>([memberId]);

    while (queue.length > 0) {
      const { id, dist } = queue.shift()!;
      if (dist >= maxDepth) continue;

      const member = await this.memberRepository.findOne({
        where: { id },
        relations: ['father', 'mother'],
      });

      if (!member) continue;

      if (member.father) {
        if (!visited.has(member.father.id)) {
          visited.add(member.father.id);
          ancestors.set(member.father.id, dist + 1);
          queue.push({ id: member.father.id, dist: dist + 1 });
        }
      }
      if (member.mother) {
        if (!visited.has(member.mother.id)) {
          visited.add(member.mother.id);
          ancestors.set(member.mother.id, dist + 1);
          queue.push({ id: member.mother.id, dist: dist + 1 });
        }
      }
    }
    return ancestors;
  }

  /**
   * Lấy mối quan hệ huyết thống
   */
  async getRelationshipType(
    memberId1: string,
    memberId2: string,
  ): Promise<string> {
    const distance = await this.getConsanguinityDistance(memberId1, memberId2);

    if (distance === -1) return 'Không có liên hệ huyết thống gần';
    if (distance === 0) return 'Bản thân';

    // Check direct line
    const isDesc1 = await this.isDescendant(memberId2, memberId1); // 1 is descendant of 2
    if (isDesc1) return `Hậu duệ (Đời ${distance})`;
    const isDesc2 = await this.isDescendant(memberId1, memberId2); // 2 is descendant of 1
    if (isDesc2) return `Tổ tiên (Đời ${distance})`;

    // Collateral line
    switch (distance) {
      case 2:
        return 'Anh chị em ruột';
      case 3:
        return 'Cô/Dì/Chú/Bác - Cháu';
      case 4:
        return 'Anh em họ (Con chú con bác)';
      case 5:
        return 'Họ hàng xa (Đời 5)';
      case 6:
        return 'Họ hàng xa (Đời 6)';
      default:
        return `Họ hàng (Khoảng cách ${distance})`;
    }
  }
}
