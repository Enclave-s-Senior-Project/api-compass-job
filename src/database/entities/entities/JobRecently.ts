import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Jobs } from './Jobs';
import { Profiles } from './Profiles';

@Index('job_recently_pkey', ['id'], { unique: true })
@Entity('job_recently', { schema: 'public' })
export class JobRecently {
    @Column('uuid', { primary: true, name: 'id' })
    id: string;

    @Column('timestamp without time zone', {
        name: 'viewed_at',
        nullable: true,
        default: () => 'CURRENT_TIMESTAMP',
    })
    viewedAt: Date | null;

    @ManyToOne(() => Jobs, (jobs) => jobs.jobRecentlies)
    @JoinColumn([{ name: 'job_id', referencedColumnName: 'id' }])
    job: Jobs;

    @ManyToOne(() => Profiles, (profiles) => profiles.jobRecentlies)
    @JoinColumn([{ name: 'profile_id', referencedColumnName: 'id' }])
    profile: Profiles;
}
