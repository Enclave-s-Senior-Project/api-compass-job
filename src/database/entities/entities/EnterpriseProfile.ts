import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Enterprises } from './Enterprises';
import { Profiles } from './Profiles';

@Index(
  'enterprise_profile_enterprise_id_profile_id_relation_type_key',
  ['enterpriseId', 'profileId', 'relationType'],
  { unique: true },
)
@Index('enterprise_profile_pkey', ['id'], { unique: true })
@Entity('enterprise_profile', { schema: 'public' })
export class EnterpriseProfile {
  @Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column('uuid', { name: 'enterprise_id', nullable: true, unique: true })
  enterpriseId: string | null;

  @Column('uuid', { name: 'profile_id', nullable: true, unique: true })
  profileId: string | null;

  @Column('boolean', { name: 'relation_type', unique: true })
  relationType: boolean;

  @ManyToOne(
    () => Enterprises,
    (enterprises) => enterprises.enterpriseProfiles,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn([{ name: 'enterprise_id', referencedColumnName: 'id' }])
  enterprise: Enterprises;

  @ManyToOne(() => Profiles, (profiles) => profiles.enterpriseProfiles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([{ name: 'profile_id', referencedColumnName: 'id' }])
  profile: Profiles;
}
