import { Test, TestingModule } from '@nestjs/testing';
import { ApplyJobService } from './services/apply-job.service';

describe('ApplyJobService', () => {
    let service: ApplyJobService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ApplyJobService],
        }).compile();

        service = module.get<ApplyJobService>(ApplyJobService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
