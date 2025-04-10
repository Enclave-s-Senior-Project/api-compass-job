import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { EnterpriseModule } from '../enterprise/enterprise.module';
import { TmpModule } from '../tmp/tmp.module';
import { CacheModule } from '@src/cache/cache.module';
import { TransactionRepository } from './repositories/transaction.repository';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [EnterpriseModule, TmpModule, CacheModule, ConfigModule],
    controllers: [TransactionController],
    providers: [TransactionService, TransactionRepository],
    exports: [TransactionService],
})
export class TransactionModule {}
