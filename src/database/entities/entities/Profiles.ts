import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { AppliedJobs } from './AppliedJobs';
import { Cvs } from './Cvs';
import { EnterpriseProfile } from './EnterpriseProfile';
import { JobFavorites } from './JobFavorites';
import { JobRecently } from './JobRecently';
import { Accounts } from './Accounts';
import { UserAddresses } from './UserAddresses';
import { UserRatings } from './UserRatings';

@Index('profiles_account_id_key', ['accountId'], { unique: true })
@Index('profiles_pkey', ['id'], { unique: true })
@Entity('profiles', { schema: 'public' })
export class Profiles {
  @Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column('character varying', { name: 'name', length: 255 })
  name: string;

  @Column('character varying', {
    name: 'profile_url',
    nullable: true,
    length: 255,
    default: () =>
      "'https://cdn.iconscout.com/icon/free/png-256/profile-417-1163876.png'",
  })
  profileUrl: string | null;

  @Column('character varying', {
    name: 'page_url',
    nullable: true,
    length: 255,
    default: () => "'http://dut.udn.vn/'",
  })
  pageUrl: string | null;

  @Column('text', {
    name: 'introduction',
    nullable: true,
    default: () => "'Hello fen :XD'",
  })
  introduction: string | null;

  @Column('character varying', { name: 'phone', nullable: true, length: 15 })
  phone: string | null;

  @Column('integer', { name: 'view', nullable: true, default: () => '0' })
  view: number | null;

  @Column('boolean', { name: 'gender', nullable: true, default: () => 'false' })
  gender: boolean | null;

  @Column('text', { name: 'education', nullable: true })
  education: string | null;

  @Column('date', { name: 'expired_premium', nullable: true })
  expiredPremium: string | null;

  @Column('boolean', { name: 'is_premium', nullable: true })
  isPremium: boolean | null;

  @Column('text', { name: 'experience', nullable: true })
  experience: string | null;

  @Column('uuid', { name: 'account_id', nullable: true, unique: true })
  accountId: string | null;

  @OneToMany(() => AppliedJobs, (appliedJobs) => appliedJobs.profile)
  appliedJobs: AppliedJobs[];

  @OneToMany(() => Cvs, (cvs) => cvs.profile)
  cvs: Cvs[];

  @OneToMany(
    () => EnterpriseProfile,
    (enterpriseProfile) => enterpriseProfile.profile,
  )
  enterpriseProfiles: EnterpriseProfile[];

  @OneToMany(() => JobFavorites, (jobFavorites) => jobFavorites.profile)
  jobFavorites: JobFavorites[];

  @OneToMany(() => JobRecently, (jobRecently) => jobRecently.profile)
  jobRecentlies: JobRecently[];

  @OneToOne(() => Accounts, (accounts) => accounts.profiles)
  @JoinColumn([{ name: 'account_id', referencedColumnName: 'id' }])
  account: Accounts;

  @OneToMany(() => UserAddresses, (userAddresses) => userAddresses.profile)
  userAddresses: UserAddresses[];

  @OneToMany(() => UserRatings, (userRatings) => userRatings.user)
  userRatings: UserRatings[];
}
