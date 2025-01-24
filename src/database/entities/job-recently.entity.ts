import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { JobEntity } from '@database/entities/job.entity';
import { ProfileEntity } from '@database/entities/profile.entity';

@Entity({ name: 'jobs_recently' })
export class JobRecentlyEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'job_recently_id' })
    readonly jobRecentlyId: string;

    @Column({
        name: 'viewed_at',
        type: 'timestamp without time zone',
        default: 'now()',
    })
    readonly viewedAt: Date;

    // relationships
    @ManyToOne(() => JobEntity, (job) => job.jobsRecently)
    @JoinColumn([{ name: 'job_id' }])
    readonly job: JobEntity;

    @ManyToOne(() => ProfileEntity, (profile) => profile.jobsRecently)
    @JoinColumn([{ name: 'profile_id' }])
    readonly profile: ProfileEntity;
}
