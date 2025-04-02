import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import {
    BaseEntity,
    EnterpriseEntity,
    TagEntity,
    JobRecentlyEntity,
    ProfileEntity,
    UserRatingEntity,
    AppliedJobEntity,
    CategoryEntity,
} from '@database/entities';
import { AddressEntity } from '@database/entities/address.entity';
import { BoostedJobsEntity } from './boosted-jobs.entity';
import { JobStatusEnum, JobTypeEnum } from '@src/common/enums/job.enum';

@Entity('jobs')
export class JobEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'job_id' })
    readonly jobId: string;

    @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
    readonly name: string;

    @Column({ name: 'lowest_wage', type: 'int', nullable: true })
    lowestWage: number | null;

    @Column({ name: 'highest_wage', type: 'int', nullable: true })
    highestWage: number | null;

    @Column({ name: 'description', type: 'text', nullable: false })
    readonly description: string;

    @Column({ name: 'responsibility', type: 'text', nullable: true })
    readonly responsibility: string;

    @Column({ name: 'type', type: 'enum', enum: JobTypeEnum, nullable: false, default: JobTypeEnum.CONTRACT })
    readonly type: JobTypeEnum;

    @Column({ name: 'experience', type: 'int', default: 0 })
    readonly experience: number;

    @Column('date', { name: 'deadline' })
    readonly deadline: Date | null;

    @Column({
        name: 'intro_img_url',
        type: 'varchar',
        length: 255,
    })
    readonly introImg: string | null;

    @Column({ name: 'status', type: 'enum', enum: JobStatusEnum, default: JobStatusEnum.OPEN })
    readonly status: JobStatusEnum;

    @Column({ name: 'education', type: 'varchar', length: 50, nullable: true })
    readonly education: string;

    @Column({ name: 'isBoost', type: 'boolean', default: false })
    readonly isBoost: boolean;

    @Column({ name: 'enterprise_benefits', type: 'text', nullable: true })
    readonly enterpriseBenefits: string | null;

    @ManyToOne(() => EnterpriseEntity, (enterprise) => enterprise.jobs, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'enterprise_id' })
    readonly enterprise: EnterpriseEntity;

    @ManyToMany(() => TagEntity, (tag) => tag.jobs)
    @JoinTable({
        name: 'job_tags',
        joinColumn: { name: 'job_id' },
        inverseJoinColumn: { name: 'tag_id' },
    })
    readonly tags: TagEntity[];

    @OneToMany(() => JobRecentlyEntity, (jobRecently) => jobRecently.job)
    readonly jobsRecently: JobRecentlyEntity[];

    @ManyToMany(() => ProfileEntity, (profile) => profile.jobs)
    readonly profiles: ProfileEntity[];

    @OneToMany(() => UserRatingEntity, (userRating) => userRating.job)
    readonly userRatings: UserRatingEntity[];

    @OneToMany(() => AppliedJobEntity, (appliedJob) => appliedJob.job, { cascade: true })
    readonly appliedJob: AppliedJobEntity[];

    @ManyToMany(() => CategoryEntity, (category) => category.jobs)
    readonly categories: CategoryEntity[];

    @ManyToMany(() => AddressEntity, (address) => address.jobs)
    readonly addresses: AddressEntity[];

    @ManyToMany(() => CategoryEntity, (category) => category.jobs)
    @JoinTable({
        name: 'job_specializations',
        joinColumn: { name: 'job_id' },
        inverseJoinColumn: { name: 'category_id' },
    })
    readonly specializations: CategoryEntity[];

    @OneToOne(() => BoostedJobsEntity, (boostedJob) => boostedJob.job)
    boostedJob: BoostedJobsEntity;
}
