import { CvService } from './services/cv.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CvController } from './cv.controller';

describe('CvController', () => {
    let controller: CvController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [CvController],
            providers: [CvService],
        }).compile();

        controller = module.get<CvController>(CvController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
