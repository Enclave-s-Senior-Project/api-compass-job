import { CvService } from './services/cv.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('CvService', () => {
    let service: CvService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CvService],
        }).compile();

        service = module.get<CvService>(CvService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
