import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EnterpriseProfile } from './EnterpriseProfile';
import { Accounts } from './Accounts';
import { Addresses } from './Addresses';
import { Jobs } from './Jobs';
import { Websites } from './Websites';

@Index('enterprises_account_id_key', ['accountId'], { unique: true })
@Index('enterprises_email_key', ['email'], { unique: true })
@Index('enterprises_pkey', ['id'], { unique: true })
@Index('enterprises_name_key', ['name'], { unique: true })
@Entity('enterprises', { schema: 'public' })
export class Enterprises {
  @Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column('character varying', { name: 'name', unique: true, length: 255 })
  name: string;

  @Column('character varying', { name: 'email', unique: true, length: 255 })
  email: string;

  @Column('character varying', { name: 'phone', nullable: true, length: 15 })
  phone: string | null;

  @Column('text', { name: 'description', nullable: true })
  description: string | null;

  @Column('text', { name: 'enterprise_benefits', nullable: true })
  enterpriseBenefits: string | null;

  @Column('text', { name: 'company_vision', nullable: true })
  companyVision: string | null;

  @Column('character varying', {
    name: 'logo_url',
    nullable: true,
    length: 255,
    default: () => "'https://example.com/default-logo.png'",
  })
  logoUrl: string | null;

  @Column('integer', { name: 'founded_in', nullable: true })
  foundedIn: number | null;

  @Column('enum', {
    name: 'organization_type',
    nullable: true,
    enum: ['private', 'flat', 'public', 'outsource'],
  })
  organizationType: 'private' | 'flat' | 'public' | 'outsource' | null;

  @Column('character varying', {
    name: 'team_size',
    nullable: true,
    length: 50,
  })
  teamSize: string | null;

  @Column('character varying', {
    name: 'industry_type',
    nullable: true,
    length: 255,
  })
  industryType: string | null;

  @Column('text', { name: 'bio', nullable: true })
  bio: string | null;

  @Column('date', { name: 'expired_premium', nullable: true })
  expiredPremium: string | null;

  @Column('boolean', { name: 'is_premium', nullable: true })
  isPremium: boolean | null;

  @Column('uuid', { name: 'account_id', nullable: true, unique: true })
  accountId: string | null;

  @OneToMany(
    () => EnterpriseProfile,
    (enterpriseProfile) => enterpriseProfile.enterprise,
  )
  enterpriseProfiles: EnterpriseProfile[];

  @OneToOne(() => Accounts, (accounts) => accounts.enterprises)
  @JoinColumn([{ name: 'account_id', referencedColumnName: 'id' }])
  account: Accounts;

  @ManyToOne(() => Addresses, (addresses) => addresses.enterprises)
  @JoinColumn([{ name: 'address_id', referencedColumnName: 'id' }])
  address: Addresses;

  @OneToMany(() => Jobs, (jobs) => jobs.enterprise)
  jobs: Jobs[];

  @OneToMany(() => Websites, (websites) => websites.enterprise)
  websites: Websites[];
}
