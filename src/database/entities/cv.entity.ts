import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity, ProfileEntity } from '@database/entities';
import { AppliedJobEntity } from '@database/entities/applied-job.entity';

@Entity({ name: 'cvs' })
export class CvEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'cv_id' })
    readonly cvId: string;

    @Column({ name: 'cv_url', type: 'varchar', length: 255 })
    readonly cvUrl: string;

    @Column({ name: 'cv_name', type: 'varchar', length: 255 })
    readonly cvName: string;

    @Column({ name: 'is_published', type: 'boolean', default: false })
    readonly isPublished: boolean;

    //     relationships
    @ManyToOne(() => ProfileEntity, (profile) => profile.cvs)
    @JoinColumn({ name: 'profile_id' })
    readonly profile: ProfileEntity;

    @OneToMany(() => AppliedJobEntity, (appliedJob) => appliedJob.cv)
    readonly appliedJob: AppliedJobEntity;
}
