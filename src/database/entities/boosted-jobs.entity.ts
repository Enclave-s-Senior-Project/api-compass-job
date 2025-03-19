import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { JobEntity } from '@database/entities/job.entity';

@Entity({ name: 'boosted_jobs' })
export class BoostedJobsEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'boosted_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    boostedAt: Date;

    @Column({ name: 'expires_at', type: 'timestamp', nullable: false })
    expiresAt: Date;

    @OneToOne(() => JobEntity, (job) => job.boostedJob)
    @JoinColumn()
    job: JobEntity;
}
