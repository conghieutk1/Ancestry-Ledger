import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GenealogyService } from './genealogy.service';
import { Member } from './entities/member.entity';

describe('GenealogyService', () => {
  let service: GenealogyService;
  let mockMemberRepository;

  beforeEach(async () => {
    mockMemberRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenealogyService,
        {
          provide: getRepositoryToken(Member),
          useValue: mockMemberRepository,
        },
      ],
    }).compile();

    service = module.get<GenealogyService>(GenealogyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('areSiblings', () => {
    it('should return true if members share same father', async () => {
      const father = { id: 'father-1', fullName: 'Father' };
      const member1: Partial<Member> = {
        id: 'member-1',
        father: father as Member,
        mother: null,
      };
      const member2: Partial<Member> = {
        id: 'member-2',
        father: father as Member,
        mother: null,
      };

      mockMemberRepository.findOne
        .mockResolvedValueOnce(member1)
        .mockResolvedValueOnce(member2);

      const result = await service.areSiblings('member-1', 'member-2');
      expect(result).toBe(true);
    });

    it('should return true if members share same mother', async () => {
      const mother = { id: 'mother-1', fullName: 'Mother' };
      const member1: Partial<Member> = {
        id: 'member-1',
        father: null,
        mother: mother as Member,
      };
      const member2: Partial<Member> = {
        id: 'member-2',
        father: null,
        mother: mother as Member,
      };

      mockMemberRepository.findOne
        .mockResolvedValueOnce(member1)
        .mockResolvedValueOnce(member2);

      const result = await service.areSiblings('member-1', 'member-2');
      expect(result).toBe(true);
    });

    it('should return false if members have different parents', async () => {
      const member1: Partial<Member> = {
        id: 'member-1',
        father: { id: 'father-1' } as Member,
        mother: null,
      };
      const member2: Partial<Member> = {
        id: 'member-2',
        father: { id: 'father-2' } as Member,
        mother: null,
      };

      mockMemberRepository.findOne
        .mockResolvedValueOnce(member1)
        .mockResolvedValueOnce(member2);

      const result = await service.areSiblings('member-1', 'member-2');
      expect(result).toBe(false);
    });

    it('should return false if one member is null', async () => {
      mockMemberRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.areSiblings('member-1', 'member-2');
      expect(result).toBe(false);
    });
  });

  describe('isDescendant', () => {
    it('should return true if target is direct child', async () => {
      const ancestor = { id: 'ancestor-1', fullName: 'Ancestor' };
      const child: Partial<Member> = {
        id: 'child-1',
        father: ancestor as Member,
        mother: null,
      };

      mockMemberRepository.findOne.mockResolvedValue(child);

      const result = await service.isDescendant('ancestor-1', 'child-1');
      expect(result).toBe(true);
    });

    it('should return true if target is grandchild', async () => {
      const ancestor = { id: 'ancestor-1' };
      const parent: Partial<Member> = {
        id: 'parent-1',
        father: ancestor as Member,
        mother: null,
      };
      const grandchild: Partial<Member> = {
        id: 'grandchild-1',
        father: parent as Member,
        mother: null,
      };

      mockMemberRepository.findOne
        .mockResolvedValueOnce(grandchild)
        .mockResolvedValueOnce(parent);

      const result = await service.isDescendant('ancestor-1', 'grandchild-1');
      expect(result).toBe(true);
    });

    it('should return false if no ancestor relationship', async () => {
      const member: Partial<Member> = {
        id: 'member-1',
        father: null,
        mother: null,
      };

      mockMemberRepository.findOne.mockResolvedValue(member);

      const result = await service.isDescendant('ancestor-1', 'member-1');
      expect(result).toBe(false);
    });
  });

  describe('getRelationshipType', () => {
    it('should return "Anh em ruột" for siblings', async () => {
      const parent = { id: 'parent-1' };
      const member1: Partial<Member> = {
        id: 'member-1',
        father: parent as Member,
      };
      const member2: Partial<Member> = {
        id: 'member-2',
        father: parent as Member,
      };

      mockMemberRepository.findOne
        .mockResolvedValueOnce(member1)
        .mockResolvedValueOnce(member2);

      const result = await service.getRelationshipType('member-1', 'member-2');
      expect(result).toBe('Anh em ruột');
    });

    it('should return "Không có liên hệ huyết thống gần" for unrelated members', async () => {
      const member1: Partial<Member> = {
        id: 'member-1',
        father: null,
        mother: null,
      };
      const member2: Partial<Member> = {
        id: 'member-2',
        father: null,
        mother: null,
      };

      mockMemberRepository.findOne
        .mockResolvedValueOnce(member1)
        .mockResolvedValueOnce(member2)
        .mockResolvedValueOnce(member1)
        .mockResolvedValueOnce(member2);

      const result = await service.getRelationshipType('member-1', 'member-2');
      expect(result).toBe('Không có liên hệ huyết thống gần');
    });
  });
});
