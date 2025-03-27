import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity, CvEntity, JobEntity, ProfileEntity } from '@database/entities';
import { Education, Experience } from '@common/enums/candidates.enum';

export enum ApplyJobStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    DENIED = 'DENIED',
}
@Entity({ name: 'applied_jobs' })
export class AppliedJobEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'applied_job_id' })
    readonly appliedJobId: string;

    @Column({ name: 'cover_letter', type: 'text', nullable: false })
    readonly coverLetter: string;

    @Column({ name: 'status', type: 'enum', enum: ApplyJobStatus, default: ApplyJobStatus.PENDING })
    status: ApplyJobStatus;

    //     relationships
    @ManyToOne(() => ProfileEntity, (profile) => profile.appliedJob)
    @JoinColumn({ name: 'profile_id' })
    readonly profile: ProfileEntity;

    @ManyToOne(() => JobEntity, (job) => job.appliedJob)
    @JoinColumn({ name: 'job_id' })
    readonly job: JobEntity;

    @ManyToOne(() => CvEntity, (cv) => cv.appliedJob)
    @JoinColumn({ name: 'cv_id' })
    readonly cv: CvEntity;
}
