import { Test, TestingModule } from '@nestjs/testing';
import { HistoryTransactionController } from './history-transaction.controller';
import { HistoryTransactionService } from './history-transaction.service';

describe('HistoryTransactionController', () => {
    let controller: HistoryTransactionController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HistoryTransactionController],
            providers: [HistoryTransactionService],
        }).compile();

        controller = module.get<HistoryTransactionController>(HistoryTransactionController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
