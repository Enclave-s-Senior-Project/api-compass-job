import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { JobEntity, ProfileEntity } from '@database/entities';

@Entity({ name: 'user_ratings' })
export class UserRatingEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'user_rating_id' })
    readonly userRatingId: string;

    @Column({ name: 'rating', type: 'int', nullable: false })
    readonly rating: number;

    @Column({ name: 'comment', type: 'text', nullable: true })
    readonly comment: string | null;

    @ManyToOne(() => JobEntity, (job) => job.userRatings)
    @JoinColumn({ name: 'job_id' })
    readonly job: JobEntity;

    @ManyToOne(() => ProfileEntity, (profile) => profile.userRatings)
    @JoinColumn([{ name: 'profile_id' }])
    readonly profile: ProfileEntity;
}
