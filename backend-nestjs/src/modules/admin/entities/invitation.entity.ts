import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../../common/decorators/roles.decorator';
import { User } from '../../user/entities/user.entity';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.MEMBER,
  })
  role: Role;

  @Column({ unique: true })
  token: string;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  acceptedAt: Date;

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
