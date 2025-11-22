import { NestFactory } from '@nestjs/core';
import { SeedModule } from './src/seed/seed.module';
import { SeedService } from './src/seed/seed.service';
import { DataSource } from 'typeorm';
import { Member } from './src/modules/member/entities/member.entity';

async function check() {
  const appContext = await NestFactory.createApplicationContext(SeedModule);
  const dataSource = appContext.get(DataSource);
  const memberCount = await dataSource.getRepository(Member).count();
  console.log(`Member count: ${memberCount}`);
  await appContext.close();
}
check();
