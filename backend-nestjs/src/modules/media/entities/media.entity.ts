import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Member } from '../../member/entities/member.entity';

export enum MediaType {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
  OTHER = 'OTHER',
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Member, { nullable: true })
  member: Member;

  @Column()
  url: string;

  @Column({
    type: 'enum',
    enum: MediaType,
    default: MediaType.IMAGE,
  })
  type: MediaType;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
