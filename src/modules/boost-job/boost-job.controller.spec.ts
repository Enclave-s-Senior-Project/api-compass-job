import { Test, TestingModule } from '@nestjs/testing';
import { BoostJobController } from './boost-job.controller';
import { BoostJobService } from './boost-job.service';

describe('BoostJobController', () => {
    let controller: BoostJobController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [BoostJobController],
            providers: [BoostJobService],
        }).compile();

        controller = module.get<BoostJobController>(BoostJobController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
