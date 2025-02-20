import {
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
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

@Entity('jobs')
export class JobEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'job_id' })
    readonly jobId: string;

    @Column({ name: 'name', type: 'varchar', length: 255, nullable: false })
    readonly name: string;

    @Column({
        name: 'lowest_wage',
        type: 'numeric',
        precision: 10,
        scale: 2,
    })
    readonly lowestWage: string | null;

    @Column({
        name: 'highest_wage',
        type: 'numeric',
        precision: 10,
        scale: 2,
    })
    readonly highestWage: string | null;

    @Column({ name: 'description', type: 'text', nullable: false })
    readonly description: string;

    // responsibility
    @Column({ name: 'responsibility', type: 'text', nullable: true })
    readonly responsibility: string;

    @Column({ name: 'type', type: 'varchar', length: 50 })
    readonly type: string | null;

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

    @Column({ name: 'status', type: 'boolean', default: false })
    readonly status: boolean;

    @ManyToOne(() => EnterpriseEntity, (enterprise) => enterprise.jobs)
    @JoinColumn({ name: 'enterprise_id' })
    readonly enterprise: EnterpriseEntity;

    @ManyToMany(() => TagEntity, (tag) => tag.jobs)
    @JoinTable({
        name: 'job_tags',
        joinColumn: { name: 'job_id' },
        inverseJoinColumn: {
            name: 'tag_id',
        },
    })
    readonly tags: TagEntity[];

    @OneToMany(() => JobRecentlyEntity, (jobRecently) => jobRecently.job)
    readonly jobsRecently: JobRecentlyEntity[];

    @ManyToMany(() => ProfileEntity, (profile) => profile.jobs)
    @JoinTable({
        name: 'jobs_favorite',
        joinColumns: [{ name: 'job_id' }],
        inverseJoinColumns: [{ name: 'profile_id' }],
    })
    readonly profiles: ProfileEntity[];

    @OneToMany(() => UserRatingEntity, (userRating) => userRating.job)
    readonly userRatings: UserRatingEntity[];

    @OneToMany(() => AppliedJobEntity, (appliedJob) => appliedJob.job)
    readonly appliedJob: AppliedJobEntity;

    @ManyToMany(() => CategoryEntity, (category) => category.jobs)
    readonly categories: CategoryEntity[];

    @ManyToMany(() => AddressEntity, (address) => address.jobs)
    readonly addresses: AddressEntity[];
}
