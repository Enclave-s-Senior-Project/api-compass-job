import { Test, TestingModule } from '@nestjs/testing';
import { TmpService } from './tmp.service';

describe('TmpService', () => {
    let service: TmpService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [TmpService],
        }).compile();

        service = module.get<TmpService>(TmpService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
