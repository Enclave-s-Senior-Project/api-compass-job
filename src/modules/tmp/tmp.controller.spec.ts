import { Test, TestingModule } from '@nestjs/testing';
import { TmpController } from './tmp.controller';
import { TmpService } from './tmp.service';

describe('TmpController', () => {
    let controller: TmpController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TmpController],
            providers: [TmpService],
        }).compile();

        controller = module.get<TmpController>(TmpController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
