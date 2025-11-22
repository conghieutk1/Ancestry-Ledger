import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Member,
  Gender,
  Visibility,
} from '../modules/member/entities/member.entity';
import {
  Marriage,
  MarriageStatus,
} from '../modules/member/entities/marriage.entity';
import { FamilyBranch } from '../modules/member/entities/family-branch.entity';
import { User } from '../modules/user/entities/user.entity';
import { Role } from '../common/decorators/roles.decorator';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Marriage)
    private marriageRepository: Repository<Marriage>,
    @InjectRepository(FamilyBranch)
    private branchRepository: Repository<FamilyBranch>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seed() {
    this.logger.log('Starting seeding...');

    // Clear existing data (optional, be careful in prod)
    // Clear existing data (optional, be careful in prod)
    await this.clearData();

    // 1. Create Family Branches
    const branches = await this.createBranches();
    this.logger.log(`Created ${branches.length} branches`);

    // 2. Create Root Ancestors (Generation 1)
    const roots = await this.createGeneration(1, [], branches);
    this.logger.log(`Created ${roots.length} root members`);

    // 3. Create Users
    await this.createUsers();
    this.logger.log('Created users');

    const memberCount = await this.memberRepository.count();
    const marriageCount = await this.marriageRepository.count();
    const branchCount = await this.branchRepository.count();
    const userCount = await this.userRepository.count();

    this.logger.log(`Seeding complete! Totals:`);
    this.logger.log(`- Members: ${memberCount}`);
    this.logger.log(`- Marriages: ${marriageCount}`);
    this.logger.log(`- Branches: ${branchCount}`);
    this.logger.log(`- Users: ${userCount}`);
  }

  private async createBranches(): Promise<FamilyBranch[]> {
    const branchNames = ['Chi 1 (Trưởng)', 'Chi 2', 'Chi 3', 'Chi 4', 'Chi 5'];
    const branches = [];
    for (const name of branchNames) {
      const branch = this.branchRepository.create({
        name,
        description: `Family branch: ${name}`,
      });
      branches.push(await this.branchRepository.save(branch));
    }
    return branches;
  }

  private async createGeneration(
    generationIndex: number,
    parents: Member[],
    branches: FamilyBranch[],
  ): Promise<Member[]> {
    if (generationIndex > 6) return [];

    const members: Member[] = [];
    const maxChildren = 6;
    const minChildren = 3;

    // If generation 1 (roots), create 1-3 roots
    if (generationIndex === 1) {
      const numRoots = this.randomInt(3, 5);
      for (let i = 0; i < numRoots; i++) {
        const root = await this.createMember(
          generationIndex,
          null,
          null,
          branches[i % branches.length],
        );
        members.push(root);

        // Spouse for root
        const spouse = await this.createMember(
          generationIndex,
          null,
          null,
          null,
          true,
        ); // Spouse usually doesn't belong to the branch by blood, but for simplicity
        await this.createMarriage(root, spouse);

        // Children
        const numChildren = this.randomInt(minChildren, maxChildren);
        const children = [];
        for (let j = 0; j < numChildren; j++) {
          // Assign branch to children based on root's branch
          children.push(
            await this.createMember(
              generationIndex + 1,
              root,
              spouse,
              root.branch,
            ),
          );
        }

        // Recurse
        await this.createGeneration(generationIndex + 1, children, branches);
      }
    } else {
      // For subsequent generations, iterate over parents (who are children of previous gen)
      for (const parent of parents) {
        // Decide if this parent gets married
        const getsMarried = Math.random() > 0.2; // 80% chance
        if (getsMarried) {
          const spouse = await this.createMember(
            generationIndex,
            null,
            null,
            null,
            true,
          );
          await this.createMarriage(parent, spouse);

          const numChildren = this.randomInt(0, 4);
          const children = [];
          for (let j = 0; j < numChildren; j++) {
            children.push(
              await this.createMember(
                generationIndex + 1,
                parent,
                spouse,
                parent.branch,
              ),
            );
          }

          if (children.length > 0) {
            await this.createGeneration(
              generationIndex + 1,
              children,
              branches,
            );
          }
        }
      }
    }

    return members;
  }

  private async createMember(
    generationIndex: number,
    father: Member | null,
    mother: Member | null,
    branch: FamilyBranch | null,
    isSpouse = false,
  ): Promise<Member> {
    const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
    const { firstName, middleName, lastName } =
      this.generateVietnameseName(gender);

    // Date of birth logic
    let yearOfBirth;
    if (father) {
      const fatherYear = father.dateOfBirth
        ? new Date(father.dateOfBirth).getFullYear()
        : 1900;
      yearOfBirth = fatherYear + this.randomInt(20, 35);
    } else if (generationIndex === 1) {
      yearOfBirth = 1900 + this.randomInt(0, 10);
    } else {
      // Spouse
      yearOfBirth = 1900 + (generationIndex - 1) * 25 + this.randomInt(-5, 5);
    }

    const dateOfBirth = new Date(
      yearOfBirth,
      this.randomInt(0, 11),
      this.randomInt(1, 28),
    );

    // Is Alive logic
    const currentYear = new Date().getFullYear();
    let isAlive = true;
    let dateOfDeath = null;

    if (
      currentYear - yearOfBirth > 90 ||
      (yearOfBirth < 1940 && Math.random() > 0.1)
    ) {
      isAlive = false;
      const ageAtDeath = this.randomInt(60, 95);
      const deathYear = yearOfBirth + ageAtDeath;
      dateOfDeath = new Date(
        Math.min(deathYear, currentYear),
        this.randomInt(0, 11),
        this.randomInt(1, 28),
      );
    }

    const member = this.memberRepository.create({
      firstName,
      middleName,
      lastName,
      fullName: `${lastName} ${middleName} ${firstName}`,
      gender,
      dateOfBirth,
      dateOfDeath,
      isAlive,
      generationIndex: isSpouse ? generationIndex : generationIndex, // Spouses are same gen
      branch,
      father: father || undefined,
      mother: mother || undefined,
      visibility: this.randomVisibility(),
      slug: `${firstName}-${lastName}-${yearOfBirth}-${Math.random().toString(36).substring(7)}`.toLowerCase(),
    });

    return this.memberRepository.save(member);
  }

  private async createMarriage(partner1: Member, partner2: Member) {
    const marriage = this.marriageRepository.create({
      partner1,
      partner2,
      startDate: new Date(
        Math.max(
          partner1.dateOfBirth.getFullYear(),
          partner2.dateOfBirth.getFullYear(),
        ) + 20,
        0,
        1,
      ),
      status: MarriageStatus.MARRIED,
    });
    return this.marriageRepository.save(marriage);
  }

  private async createUsers() {
    const salt = await bcrypt.genSalt();
    const adminPasswordHash = await bcrypt.hash('adminadmin', salt);
    const memberPasswordHash = await bcrypt.hash('12345678', salt);

    // Admin
    await this.userRepository.save({
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      displayName: 'Admin User',
    });

    // Member users
    // Try to link to some existing members
    const members = await this.memberRepository.find({ take: 5 });
    for (let i = 0; i < members.length; i++) {
      await this.userRepository.save({
        email: `member${i + 1}@example.com`,
        passwordHash: memberPasswordHash,
        role: Role.MEMBER,
        displayName: members[i].fullName,
        member: members[i],
      });
    }
  }

  private generateVietnameseName(gender: Gender) {
    const lastNames = [
      'Nguyễn',
      'Trần',
      'Lê',
      'Phạm',
      'Hoàng',
      'Vũ',
      'Đặng',
      'Bùi',
      'Đỗ',
      'Hồ',
    ];
    const middleNamesMale = ['Văn', 'Hữu', 'Quốc', 'Ngọc', 'Minh', 'Đức'];
    const middleNamesFemale = ['Thị', 'Ngọc', 'Phương', 'Thanh', 'Thu', 'Hồng'];
    const firstNamesMale = [
      'Anh',
      'Bình',
      'Cường',
      'Dũng',
      'Hải',
      'Hùng',
      'Nam',
      'Phong',
      'Huy',
      'Long',
      'Tùng',
      'Việt',
    ];
    const firstNamesFemale = [
      'Lan',
      'Hoa',
      'Mai',
      'Hạnh',
      'Thảo',
      'Trang',
      'Ngân',
      'Vy',
      'Nhung',
      'Hương',
      'Linh',
      'Thu',
    ];

    const lastName = this.randomItem(lastNames);
    const middleName =
      gender === Gender.MALE
        ? this.randomItem(middleNamesMale)
        : this.randomItem(middleNamesFemale);
    const firstName =
      gender === Gender.MALE
        ? this.randomItem(firstNamesMale)
        : this.randomItem(firstNamesFemale);

    return { firstName, middleName, lastName };
  }

  private randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomVisibility(): Visibility {
    const rand = Math.random();
    if (rand < 0.7) return Visibility.PUBLIC;
    if (rand < 0.95) return Visibility.MEMBERS_ONLY;
    return Visibility.PRIVATE;
  }

  private async clearData() {
    this.logger.log('Clearing data...');
    await this.userRepository.delete({});
    await this.marriageRepository.delete({});
    // Members have self-referencing foreign keys (father, mother), so we might need to handle that.
    // But delete({}) usually works if no other constraints block it.
    // However, if there are circular dependencies or strict constraints, we might need to set columns to null first.
    // For now, let's try simple delete. If it fails, we'll improve.
    // Actually, members have foreign keys to branches too.
    await this.memberRepository.query('DELETE FROM member'); // Use query to bypass some checks if needed, or just repository.delete
    await this.branchRepository.delete({});
    this.logger.log('Data cleared.');
  }
}
