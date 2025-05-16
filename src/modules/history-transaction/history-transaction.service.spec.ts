import { Test, TestingModule } from '@nestjs/testing';
import { HistoryTransactionService } from './history-transaction.service';

describe('HistoryTransactionService', () => {
    let service: HistoryTransactionService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [HistoryTransactionService],
        }).compile();

        service = module.get<HistoryTransactionService>(HistoryTransactionService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
