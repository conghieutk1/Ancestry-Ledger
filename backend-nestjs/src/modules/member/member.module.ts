import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { Marriage } from './entities/marriage.entity';
import { FamilyBranch } from './entities/family-branch.entity';
import { MemberService } from './member.service';
import { MarriageService } from './marriage.service';
import { MemberController } from './member.controller';
import { FamilyBranchController } from './family-branch.controller';
import { MarriageController } from './marriage.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Member, Marriage, FamilyBranch])],
  controllers: [MemberController, FamilyBranchController, MarriageController],
  providers: [MemberService, MarriageService],
  exports: [MemberService, MarriageService],
})
export class MemberModule {}
