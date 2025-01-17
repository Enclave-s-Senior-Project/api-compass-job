import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Cvs } from './Cvs';
import { Jobs } from './Jobs';
import { Profiles } from './Profiles';

@Index('applied_jobs_pkey', ['id'], { unique: true })
@Entity('applied_jobs', { schema: 'public' })
export class AppliedJobs {
  @Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column('text', { name: 'cover_letter', nullable: true })
  coverLetter: string | null;

  @Column('boolean', { name: 'status', nullable: true, default: () => 'false' })
  status: boolean | null;

  @Column('boolean', {
    name: 'is_denied',
    nullable: true,
    default: () => 'false',
  })
  isDenied: boolean | null;

  @ManyToOne(() => Cvs, (cvs) => cvs.appliedJobs)
  @JoinColumn([{ name: 'cv_id', referencedColumnName: 'id' }])
  cv: Cvs;

  @ManyToOne(() => Jobs, (jobs) => jobs.appliedJobs)
  @JoinColumn([{ name: 'job_id', referencedColumnName: 'id' }])
  job: Jobs;

  @ManyToOne(() => Profiles, (profiles) => profiles.appliedJobs)
  @JoinColumn([{ name: 'profile_id', referencedColumnName: 'id' }])
  profile: Profiles;
}
