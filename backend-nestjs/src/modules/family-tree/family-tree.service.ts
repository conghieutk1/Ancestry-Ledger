import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../member/entities/member.entity';

@Injectable()
export class FamilyTreeService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
  ) {}

  async getRootMembers(): Promise<Member[]> {
    // Simple heuristic: members with no parents
    return this.memberRepository.find({
      where: { father: null, mother: null },
      relations: ['children'],
      take: 10, // Limit to avoid huge payload if many roots
    });
  }

  async getTreeForMember(memberId: string): Promise<any> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: [
        'father',
        'mother',
        'children',
        'marriagesAsPartner1',
        'marriagesAsPartner1.partner2',
        'marriagesAsPartner2',
        'marriagesAsPartner2.partner1',
      ],
    });

    if (!member) {
      return null;
    }

    // Construct a graph representation
    // This is a simplified version. Real-world tree traversal is more complex.
    const nodes = [];
    const edges = [];

    const addNode = (m: Member) => {
      if (!nodes.find((n) => n.id === m.id)) {
        nodes.push({
          id: m.id,
          name: m.fullName,
          gender: m.gender,
          isAlive: m.isAlive,
          avatarUrl: m.avatarUrl,
          generationIndex: m.generationIndex,
        });
      }
    };

    addNode(member);
    if (member.father) {
      addNode(member.father);
      edges.push({ from: member.father.id, to: member.id, type: 'parent' });
    }
    if (member.mother) {
      addNode(member.mother);
      edges.push({ from: member.mother.id, to: member.id, type: 'parent' });
    }

    member.children?.forEach((child) => {
      addNode(child);
      edges.push({ from: member.id, to: child.id, type: 'parent' });
    });

    // Spouses
    member.marriagesAsPartner1?.forEach((m) => {
      if (m.partner2) {
        addNode(m.partner2);
        edges.push({ from: member.id, to: m.partner2.id, type: 'spouse' });
      }
    });
    member.marriagesAsPartner2?.forEach((m) => {
      if (m.partner1) {
        addNode(m.partner1);
        edges.push({ from: member.id, to: m.partner1.id, type: 'spouse' });
      }
    });

    return { nodes, edges };
  }

  async getAncestors(
    _memberId: string,
    _maxDepth: number = 3,
  ): Promise<Member[]> {
    // Recursive CTE is better for this, but let's do simple recursive fetch for now or just return direct parents
    // For v1, let's just return up to grandparents
    return []; // TODO: Implement recursive fetch
  }

  async getDescendants(
    _memberId: string,
    _maxDepth: number = 3,
  ): Promise<Member[]> {
    // TODO: Implement recursive fetch
    return [];
  }
}
