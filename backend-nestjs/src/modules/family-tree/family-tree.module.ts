import { Module } from '@nestjs/common';
import { FamilyTreeService } from './family-tree.service';
import { FamilyTreeController } from './family-tree.controller';
import { MemberModule } from '../member/member.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../member/entities/member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Member]), MemberModule],
  controllers: [FamilyTreeController],
  providers: [FamilyTreeService],
})
export class FamilyTreeModule {}
