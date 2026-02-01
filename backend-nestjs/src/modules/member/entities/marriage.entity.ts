import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Member } from './member.entity';

export enum MarriageStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
}

@Entity('marriages')
export class Marriage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Member, (member) => member.marriagesAsPartner1)
  partner1: Member;

  @ManyToOne(() => Member, (member) => member.marriagesAsPartner2, {
    nullable: true,
  })
  partner2: Member | null;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: MarriageStatus,
    default: MarriageStatus.MARRIED,
  })
  status: MarriageStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
