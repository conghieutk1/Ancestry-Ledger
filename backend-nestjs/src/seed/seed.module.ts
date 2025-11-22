import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SeedService } from './seed.service';
import { Member } from '../modules/member/entities/member.entity';
import { Marriage } from '../modules/member/entities/marriage.entity';
import { FamilyBranch } from '../modules/member/entities/family-branch.entity';
import { User } from '../modules/user/entities/user.entity';
import { Media } from '../modules/media/entities/media.entity';
import { Invitation } from '../modules/admin/entities/invitation.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [Member, Marriage, FamilyBranch, User, Media, Invitation],
        synchronize: true, // Ensure schema is synced for seeding
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Member, Marriage, FamilyBranch, User]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
