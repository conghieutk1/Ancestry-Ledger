import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/decorators/roles.decorator';
import { Member } from '../../member/entities/member.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.MEMBER,
  })
  role: Role;

  @Column({ nullable: true })
  displayName: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => Member, (member) => member.user, { nullable: true })
  member?: Member;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
