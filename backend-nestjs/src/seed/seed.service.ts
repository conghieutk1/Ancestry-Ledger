import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
    private dataSource: DataSource,
  ) {}

  async seed() {
    this.logger.log('Starting seeding...');

    await this.clearData();

    // 1. Create Family Branches
    const branches = await this.createBranches();
    this.logger.log(`Created ${branches.length} branches`);

    // 2. Create Root Ancestor (Gen 1)
    const root = await this.createRootAncestor();
    this.logger.log(`Created Root Ancestor: ${root.fullName}`);

    // 3. Create 4 Sons (Gen 2) - Heads of 4 Branches
    const branchHeads = await this.createBranchHeads(root, branches);
    this.logger.log(`Created ${branchHeads.length} branch heads`);

    // 4. Expand each branch to ~100 members
    for (let i = 0; i < branchHeads.length; i++) {
      await this.expandBranch(branchHeads[i], branches[i], 100);
      this.logger.log(`Expanded Branch ${branches[i].name}`);
    }

    // 5. Create Users
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

  private async clearData() {
    this.logger.log('Clearing data...');
    try {
      // Use TRUNCATE with CASCADE to clear everything cleanly
      await this.dataSource.query(
        'TRUNCATE TABLE "users", "marriages", "members", "family_branches" RESTART IDENTITY CASCADE',
      );
    } catch (error) {
      this.logger.error('Error clearing data, falling back to delete', error);
      await this.userRepository.delete({});
      await this.marriageRepository.delete({});
      await this.memberRepository.delete({});
      await this.branchRepository.delete({});
    }
    this.logger.log('Data cleared.');
  }

  private async createBranches(): Promise<FamilyBranch[]> {
    const branchConfigs = [
      { name: 'Chi 1 (Trưởng)', order: 1, isTrưởng: true },
      { name: 'Chi 2', order: 2, isTrưởng: false },
      { name: 'Chi 3', order: 3, isTrưởng: false },
      { name: 'Chi 4', order: 4, isTrưởng: false },
    ];

    const branches = [];
    for (const config of branchConfigs) {
      const branch = this.branchRepository.create({
        name: config.name,
        description: `Dòng họ Đặng Hữu - ${config.name}`,
        branchOrder: config.order,
        isTrưởng: config.isTrưởng,
      });
      branches.push(await this.branchRepository.save(branch));
    }
    return branches;
  }

  private async createRootAncestor(): Promise<Member> {
    // Gen 1: Born ~1900
    const yearOfBirth = 1900;
    const dateOfBirth = new Date(yearOfBirth, 0, 1);
    const dateOfDeath = new Date(yearOfBirth + 70, 0, 1); // Died at 70

    const firstName = 'Tổ';
    const lastName = 'Đặng';
    const place = 'Hà Tĩnh';

    const root = this.memberRepository.create({
      firstName,
      middleName: 'Hữu',
      lastName,
      fullName: 'Đặng Hữu Tổ',
      gender: Gender.MALE,
      dateOfBirth,
      dateOfDeath,
      isAlive: false,
      generationIndex: 1,
      visibility: Visibility.PUBLIC,
      slug: this.generateSlug(firstName, lastName, yearOfBirth),
      placeOfBirth: place,
      placeOfDeath: place,
      occupation: 'Nông dân',
      bio: 'Người khai sinh ra dòng họ Đặng Hữu tại vùng đất này.',
      notes: 'Mộ phần đặt tại khu A nghĩa trang dòng họ.',
      phoneNumber: null, // No phone for ancestor
    });
    return this.memberRepository.save(root);
  }

  private async createBranchHeads(
    root: Member,
    branches: FamilyBranch[],
  ): Promise<Member[]> {
    // Create Spouse for Root
    const rootSpouse = await this.createSpouse(root, 1900);
    await this.createMarriage(root, rootSpouse);

    const heads = [];
    // Gen 2: Born ~1925
    const baseYear = 1925;
    const headNames = ['Cả', 'Hai', 'Ba', 'Bốn'];

    for (let i = 0; i < branches.length; i++) {
      const birthYear = baseYear + i * 2; // Stagger births
      const dateOfBirth = new Date(birthYear, this.randomInt(0, 11), 1);
      const isAlive = false;
      const dateOfDeath = new Date(birthYear + this.randomInt(60, 80), 0, 1);

      const firstName = headNames[i] || 'Hùng';
      const lastName = 'Đặng';
      const middleName = 'Hữu';
      const place = 'Hà Tĩnh';

      const head = this.memberRepository.create({
        firstName,
        middleName,
        lastName,
        fullName: `${lastName} ${middleName} ${firstName}`,
        gender: Gender.MALE,
        dateOfBirth,
        dateOfDeath,
        isAlive,
        generationIndex: 2,
        branch: branches[i],
        father: root,
        mother: rootSpouse,
        visibility: Visibility.PUBLIC,
        slug: this.generateSlug(firstName, lastName, birthYear),
        placeOfBirth: place,
        placeOfDeath: place,
        occupation: 'Trưởng tộc/Trưởng chi',
        bio: `Người đứng đầu ${branches[i].name}`,
        notes: 'Có công lớn trong việc xây dựng nhà thờ họ.',
        phoneNumber: null,
      });
      heads.push(await this.memberRepository.save(head));
    }
    return heads;
  }

  private generateSlug(
    firstName: string,
    lastName: string,
    year: number,
  ): string {
    // Simple slugify: remove accents, lowercase, remove special chars
    const str = `${firstName}-${lastName}-${year}-${Math.random().toString(36).substring(7)}`;
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
  }

  private async expandBranch(
    head: Member,
    branch: FamilyBranch,
    targetCount: number,
  ) {
    const queue: Member[] = [head];
    let currentCount = 1; // Head is already created

    while (queue.length > 0 && currentCount < targetCount) {
      const currentMale = queue.shift();

      // Safety check
      if (!currentMale) continue;

      // Determine if this male gets married (high chance for lineage expansion)
      // Gen 2 (Head) always married. Others 90% chance.
      if (currentMale.generationIndex > 2 && Math.random() > 0.9) continue;

      // Create Spouse
      const spouse = await this.createSpouse(
        currentMale,
        currentMale.dateOfBirth.getFullYear(),
      );
      await this.createMarriage(currentMale, spouse);

      // Determine number of children
      // Earlier generations have more children
      let numChildren = 0;
      if (currentMale.generationIndex <= 3) {
        numChildren = this.randomInt(4, 7);
      } else if (currentMale.generationIndex <= 4) {
        numChildren = this.randomInt(3, 5);
      } else {
        numChildren = this.randomInt(2, 3);
      }

      // Generate Children
      for (let i = 0; i < numChildren; i++) {
        if (currentCount >= targetCount) break;

        const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
        const child = await this.createChild(
          currentMale,
          spouse,
          branch,
          gender,
        );
        currentCount++;

        // If Male, add to queue to continue lineage
        if (gender === Gender.MALE) {
          queue.push(child);
        }
      }
    }
  }

  private async createSpouse(
    partner: Member,
    partnerBirthYear: number,
  ): Promise<Member> {
    const gender = partner.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE;
    const { firstName, middleName, lastName } = this.generateRandomName(gender);

    const birthYear = partnerBirthYear + this.randomInt(-5, 5);
    const dateOfBirth = new Date(
      birthYear,
      this.randomInt(0, 11),
      this.randomInt(1, 28),
    );

    // Calculate status based on birth year
    const currentYear = new Date().getFullYear();
    let isAlive = true;
    let dateOfDeath = null;

    if (
      currentYear - birthYear > 95 ||
      (birthYear < 1940 && Math.random() > 0.1)
    ) {
      isAlive = false;
      dateOfDeath = new Date(
        birthYear + this.randomInt(60, 90),
        this.randomInt(0, 11),
        1,
      );
    }

    const place = this.generateRandomPlace();
    const occupation = this.generateRandomOccupation();
    const phoneNumber = isAlive ? this.generateRandomPhoneNumber() : null;

    const spouse = this.memberRepository.create({
      firstName,
      middleName,
      lastName,
      fullName: `${lastName} ${middleName} ${firstName}`,
      gender,
      dateOfBirth,
      dateOfDeath,
      isAlive,
      generationIndex: partner.generationIndex, // Same generation as partner
      visibility: Visibility.PUBLIC,
      slug: this.generateSlug(firstName, lastName, birthYear),
      placeOfBirth: place,
      placeOfDeath: isAlive ? null : place,
      occupation: occupation,
      bio: `Vợ/Chồng của ${partner.fullName}`,
      notes: 'Dâu/Rể trong dòng họ.',
      phoneNumber: phoneNumber,
    });

    return this.memberRepository.save(spouse);
  }

  private async createChild(
    father: Member,
    mother: Member,
    branch: FamilyBranch,
    gender: Gender,
  ): Promise<Member> {
    // Lineage name
    const lastName = 'Đặng';
    const middleName = gender === Gender.MALE ? 'Hữu' : 'Thị';
    const firstName = this.getRandomFirstName(gender);

    // Birth year: Father's birth + 20-40 years
    const fatherBirthYear = father.dateOfBirth.getFullYear();
    const birthYear = fatherBirthYear + this.randomInt(22, 35);
    const dateOfBirth = new Date(
      birthYear,
      this.randomInt(0, 11),
      this.randomInt(1, 28),
    );

    // Status
    const currentYear = new Date().getFullYear();
    let isAlive = true;
    let dateOfDeath = null;

    if (
      currentYear - birthYear > 90 ||
      (birthYear < 1940 && Math.random() > 0.2)
    ) {
      isAlive = false;
      dateOfDeath = new Date(
        birthYear + this.randomInt(50, 85),
        this.randomInt(0, 11),
        1,
      );
    }

    const place = this.generateRandomPlace();
    const occupation = this.generateRandomOccupation();
    const phoneNumber = isAlive ? this.generateRandomPhoneNumber() : null;

    const child = this.memberRepository.create({
      firstName,
      middleName,
      lastName,
      fullName: `${lastName} ${middleName} ${firstName}`,
      gender,
      dateOfBirth,
      dateOfDeath,
      isAlive,
      generationIndex: father.generationIndex + 1,
      branch,
      father,
      mother,
      visibility: Visibility.MEMBERS_ONLY,
      slug: this.generateSlug(firstName, lastName, birthYear),
      placeOfBirth: place,
      placeOfDeath: isAlive ? null : place,
      occupation: occupation,
      bio: `Con của ${father.fullName} và ${mother.fullName}`,
      notes: '',
      phoneNumber: phoneNumber,
    });

    return this.memberRepository.save(child);
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

    // Admin
    await this.userRepository.save({
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      displayName: 'Admin User',
    });
  }

  private generateRandomName(gender: Gender) {
    const lastNames = [
      'Nguyễn',
      'Trần',
      'Lê',
      'Phạm',
      'Hoàng',
      'Vũ',
      'Bùi',
      'Đỗ',
      'Hồ',
      'Ngô',
      'Dương',
      'Lý',
    ];
    const middleNamesMale = ['Văn', 'Đức', 'Minh', 'Quốc', 'Thành', 'Công'];
    const middleNamesFemale = ['Thị', 'Ngọc', 'Thu', 'Hồng', 'Thanh', 'Mỹ'];

    const lastName = this.randomItem(lastNames);
    const middleName =
      gender === Gender.MALE
        ? this.randomItem(middleNamesMale)
        : this.randomItem(middleNamesFemale);
    const firstName = this.getRandomFirstName(gender);

    return { firstName, middleName, lastName };
  }

  private getRandomFirstName(gender: Gender): string {
    const maleNames = [
      'Anh',
      'Bình',
      'Cường',
      'Dũng',
      'Đức',
      'Hải',
      'Hiếu',
      'Hoàng',
      'Hùng',
      'Huy',
      'Khánh',
      'Khoa',
      'Lâm',
      'Long',
      'Minh',
      'Nam',
      'Nghĩa',
      'Phong',
      'Phúc',
      'Quân',
      'Quang',
      'Sơn',
      'Thắng',
      'Thành',
      'Thiên',
      'Thịnh',
      'Tiến',
      'Toàn',
      'Trọng',
      'Trung',
      'Tuấn',
      'Tùng',
      'Việt',
      'Vinh',
      'Vũ',
      'Xuân',
      'Yên',
    ];
    const femaleNames = [
      'An',
      'Anh',
      'Bích',
      'Châu',
      'Chi',
      'Diệp',
      'Dung',
      'Duyên',
      'Giang',
      'Hà',
      'Hạnh',
      'Hoa',
      'Hồng',
      'Huyền',
      'Hương',
      'Khánh',
      'Lan',
      'Linh',
      'Loan',
      'Ly',
      'Mai',
      'Minh',
      'My',
      'Ngân',
      'Ngọc',
      'Nhung',
      'Oanh',
      'Phương',
      'Quyên',
      'Quỳnh',
      'Tâm',
      'Thảo',
      'Thi',
      'Thu',
      'Thủy',
      'Thư',
      'Trang',
      'Trâm',
      'Trinh',
      'Tú',
      'Uyên',
      'Vân',
      'Vi',
      'Vy',
      'Xuân',
      'Yến',
    ];
    return gender === Gender.MALE
      ? this.randomItem(maleNames)
      : this.randomItem(femaleNames);
  }

  private generateRandomPlace(): string {
    const places = [
      'Hà Nội',
      'Hồ Chí Minh',
      'Đà Nẵng',
      'Hải Phòng',
      'Cần Thơ',
      'Nghệ An',
      'Thanh Hóa',
      'Hà Tĩnh',
      'Quảng Bình',
      'Huế',
      'Nam Định',
      'Thái Bình',
    ];
    return this.randomItem(places);
  }

  private generateRandomOccupation(): string {
    const occupations = [
      'Giáo viên',
      'Bác sĩ',
      'Kỹ sư',
      'Nông dân',
      'Kinh doanh',
      'Công chức',
      'Bộ đội',
      'Công an',
      'Sinh viên',
      'Học sinh',
      'Nội trợ',
      'Lập trình viên',
    ];
    return this.randomItem(occupations);
  }

  private generateRandomPhoneNumber(): string {
    const prefixes = ['09', '03', '07', '08', '05'];
    const prefix = this.randomItem(prefixes);
    const suffix = Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, '0');
    return `${prefix}${suffix}`;
  }

  private randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
