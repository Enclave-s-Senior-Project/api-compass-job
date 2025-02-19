import { Module } from '@nestjs/common';
import { CategoryService } from './services';
import { CategoryController } from './category.controller';
import { TmpModule } from '@modules/tmp/tmp.module';
import { CategoryRepository } from './repositories';

@Module({
    imports: [TmpModule],
    controllers: [CategoryController],
    providers: [CategoryService, CategoryRepository],
})
export class CategoryModule {}
