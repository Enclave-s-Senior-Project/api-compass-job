import { Module } from '@nestjs/common';
import { TmpService } from './tmp.service';
import { TmpController } from './tmp.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
    AccountEntity,
    AddressEntity,
    AppliedJobEntity,
    CategoryEntity,
    CvEntity,
    EnterpriseEntity,
    JobEntity,
    JobRecentlyEntity,
    ProfileEntity,
    TagEntity,
    UserRatingEntity,
    WebsiteEntity,
    BoostedJobsEntity,
} from '@database/entities';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            AccountEntity,
            ProfileEntity,
            EnterpriseEntity,
            WebsiteEntity,
            JobEntity,
            TagEntity,
            JobRecentlyEntity,
            UserRatingEntity,
            CvEntity,
            AppliedJobEntity,
            CategoryEntity,
            AddressEntity,
            BoostedJobsEntity,
        ]),
    ],
    controllers: [TmpController],
    providers: [TmpService],
    exports: [TypeOrmModule],
})
export class TmpModule {}
