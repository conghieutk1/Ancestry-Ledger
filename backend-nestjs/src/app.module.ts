import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { MemberModule } from './modules/member/member.module';
import { FamilyTreeModule } from './modules/family-tree/family-tree.module';
import { MediaModule } from './modules/media/media.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { User } from './modules/user/entities/user.entity';
import { Member } from './modules/member/entities/member.entity';
import { Marriage } from './modules/member/entities/marriage.entity';
import { Media } from './modules/media/entities/media.entity';
import { Invitation } from './modules/admin/entities/invitation.entity';
import { FamilyBranch } from './modules/member/entities/family-branch.entity';

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
        entities: [User, Member, Marriage, Media, Invitation, FamilyBranch],
        synchronize: true, // Set to false in production
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    MemberModule,
    FamilyTreeModule,
    MediaModule,
    AdminModule,
    HealthModule,
  ],
})
export class AppModule {}
