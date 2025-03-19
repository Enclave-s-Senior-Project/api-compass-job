import { Test, TestingModule } from '@nestjs/testing';
import { BoostJobService } from './boost-job.service';

describe('BoostJobService', () => {
    let service: BoostJobService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [BoostJobService],
        }).compile();

        service = module.get<BoostJobService>(BoostJobService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
