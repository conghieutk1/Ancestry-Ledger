import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Member } from './member.entity';

@Entity('family_branches')
export class FamilyBranch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  branchOrder: number;

  @Column({ default: false })
  isTrưởng: boolean;

  @ManyToOne(() => Member, { nullable: true })
  rootMember: Member;

  @OneToMany(() => Member, (member) => member.branch)
  members: Member[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
