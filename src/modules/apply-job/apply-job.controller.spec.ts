import { Test, TestingModule } from '@nestjs/testing';
import { ApplyJobController } from './apply-job.controller';
import { ApplyJobService } from './services/apply-job.service';

describe('ApplyJobController', () => {
    let controller: ApplyJobController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ApplyJobController],
            providers: [ApplyJobService],
        }).compile();

        controller = module.get<ApplyJobController>(ApplyJobController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
