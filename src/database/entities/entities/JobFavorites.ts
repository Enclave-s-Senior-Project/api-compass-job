import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Jobs } from './Jobs';
import { Profiles } from './Profiles';

@Index('job_favorites_pkey', ['id'], { unique: true })
@Index('job_favorites_profile_id_job_id_key', ['jobId', 'profileId'], {
    unique: true,
})
@Entity('job_favorites', { schema: 'public' })
export class JobFavorites {
    @Column('uuid', { primary: true, name: 'id' })
    id: string;

    @Column('uuid', { name: 'profile_id', nullable: true, unique: true })
    profileId: string | null;

    @Column('uuid', { name: 'job_id', nullable: true, unique: true })
    jobId: string | null;

    @ManyToOne(() => Jobs, (jobs) => jobs.jobFavorites)
    @JoinColumn([{ name: 'job_id', referencedColumnName: 'id' }])
    job: Jobs;

    @ManyToOne(() => Profiles, (profiles) => profiles.jobFavorites)
    @JoinColumn([{ name: 'profile_id', referencedColumnName: 'id' }])
    profile: Profiles;
}
