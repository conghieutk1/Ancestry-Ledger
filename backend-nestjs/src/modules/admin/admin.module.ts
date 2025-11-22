import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Invitation])],
  controllers: [AdminController],
})
export class AdminModule {}
