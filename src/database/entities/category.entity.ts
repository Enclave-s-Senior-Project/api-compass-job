import {
    Column,
    Entity,
    Index,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity, JobEntity } from '@database/entities';

@Entity({ name: 'categories' })
export class CategoryEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'category_id' })
    readonly categoryId: string;

    @Column({ name: 'category_name', type: 'varchar', length: 255 })
    @Index()
    readonly categoryName: string;

    //     relationships
    @ManyToOne(() => CategoryEntity, (category) => category.parent)
    @JoinColumn({ name: 'parent_id' })
    parent: CategoryEntity;

    @OneToMany(() => CategoryEntity, (category) => category.parent)
    children: CategoryEntity[];

    @ManyToMany(() => JobEntity, (job) => job.categories)
    @JoinTable({ name: 'job_categories', joinColumn: { name: 'category_id' }, inverseJoinColumn: { name: 'job_id' } })
    readonly jobs: JobEntity[];
    get isChild(): boolean {
        return this.parent !== null;
    }
}
