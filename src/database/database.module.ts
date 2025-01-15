import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { DatabaseService } from './database.service';

@Module({
  imports: [...databaseProviders],
  providers: [DatabaseService],
})
export class DatabaseModule {}
