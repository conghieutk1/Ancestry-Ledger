import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { Marriage } from './entities/marriage.entity';
import { MemberService } from './member.service';
import { MemberController } from './member.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Member, Marriage])],
  controllers: [MemberController],
  providers: [MemberService],
  exports: [MemberService],
})
export class MemberModule {}
