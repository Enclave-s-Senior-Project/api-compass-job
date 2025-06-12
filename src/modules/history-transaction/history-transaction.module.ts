import { Module } from '@nestjs/common';
import { HistoryTransactionService } from './history-transaction.service';
import { HistoryTransactionController } from './history-transaction.controller';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@src/cache/cache.module';
import { TmpModule } from '../tmp/tmp.module';
import { HistoryTransactionRepository } from './repositories/history-transaction.repositories';

@Module({
    imports: [TmpModule, CacheModule, ConfigModule],
    controllers: [HistoryTransactionController],
    providers: [HistoryTransactionService, HistoryTransactionRepository],
    exports: [HistoryTransactionService],
})
export class HistoryTransactionModule {}
