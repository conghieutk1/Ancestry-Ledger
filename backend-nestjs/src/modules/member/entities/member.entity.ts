import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Marriage } from './marriage.entity';
import { FamilyBranch } from './family-branch.entity';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}

export enum Visibility {
  PUBLIC = 'PUBLIC',
  MEMBERS_ONLY = 'MEMBERS_ONLY',
  PRIVATE = 'PRIVATE',
}

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  middleName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column()
  fullName: string;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.UNKNOWN,
  })
  gender: Gender;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ type: 'date', nullable: true })
  dateOfDeath: Date;

  @Column({ default: true })
  isAlive: boolean;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  placeOfBirth: string;

  @Column({ nullable: true })
  placeOfDeath: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  generationIndex: number;

  @Column({
    type: 'enum',
    enum: Visibility,
    default: Visibility.MEMBERS_ONLY,
  })
  visibility: Visibility;

  @OneToOne(() => User, (user) => user.member, { nullable: true })
  @JoinColumn()
  user?: User;

  @ManyToOne(() => Member, (member) => member.children, { nullable: true })
  father: Member;

  @ManyToOne(() => Member, (member) => member.children, { nullable: true })
  mother: Member;

  @OneToMany(() => Member, (member) => member.father)
  children: Member[];

  // This is a simplification. Spouses are handled via Marriage entity.
  @OneToMany(() => Marriage, (marriage) => marriage.partner1)
  marriagesAsPartner1: Marriage[];

  @OneToMany(() => Marriage, (marriage) => marriage.partner2)
  marriagesAsPartner2: Marriage[];

  @ManyToOne(() => FamilyBranch, (branch) => branch.members, { nullable: true })
  branch: FamilyBranch;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
