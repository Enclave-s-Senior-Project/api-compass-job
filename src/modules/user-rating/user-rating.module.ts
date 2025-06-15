import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRatingController } from './user-rating.controller';
import { UserRatingService } from './services/user-rating.service';
import { TmpModule } from '../tmp/tmp.module';
@Module({
    imports: [TmpModule],
    controllers: [UserRatingController],
    providers: [UserRatingService],
    exports: [UserRatingService],
})
export class UserRatingModule {}
