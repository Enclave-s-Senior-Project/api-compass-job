import { CvService } from './services/cv.service';
import { Module } from '@nestjs/common';
import { CvController } from './cv.controller';
import { TmpModule } from '@modules/tmp/tmp.module';
import { CvRepository } from './repositories/cv.repository';
import { UserModule } from '@modules/user/user.module';

@Module({
    imports: [TmpModule],
    controllers: [CvController],
    providers: [CvService, CvRepository],
    exports: [CvService],
})
export class CvModule {}
