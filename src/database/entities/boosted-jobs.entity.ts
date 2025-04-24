import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { JobEntity } from '@database/entities/job.entity';
import { EnterpriseEntity } from './enterprise.entity';

@Entity({ name: 'boosted_jobs' })
export class BoostedJobsEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'boosted_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    boostedAt: Date;

    @OneToOne(() => JobEntity, (job) => job.boostedJob)
    @JoinColumn({ name: 'job_id' })
    job: JobEntity;

    @Column({ name: 'points_used', type: 'int', nullable: false, unique: true })
    pointsUsed: number;

    @ManyToOne(() => EnterpriseEntity, (enterprise) => enterprise.boostedJobs, { nullable: false })
    @JoinColumn({ name: 'enterprise_id' })
    enterprise: EnterpriseEntity;
}
