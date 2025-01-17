import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Jobs } from './Jobs';
import { Profiles } from './Profiles';

@Index('user_ratings_pkey', ['id'], { unique: true })
@Entity('user_ratings', { schema: 'public' })
export class UserRatings {
  @Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column('integer', { name: 'rating', nullable: true })
  rating: number | null;

  @Column('text', { name: 'comment', nullable: true })
  comment: string | null;

  @ManyToOne(() => Jobs, (jobs) => jobs.userRatings)
  @JoinColumn([{ name: 'job_id', referencedColumnName: 'id' }])
  job: Jobs;

  @ManyToOne(() => Profiles, (profiles) => profiles.userRatings)
  @JoinColumn([{ name: 'user_id', referencedColumnName: 'id' }])
  user: Profiles;
}
