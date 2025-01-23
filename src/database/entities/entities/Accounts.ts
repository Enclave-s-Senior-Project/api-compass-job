import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Roles } from './Roles';
import { Enterprises } from './Enterprises';
import { Profiles } from './Profiles';

@Index('accounts_email_key', ['email'], { unique: true })
@Index('accounts_pkey', ['id'], { unique: true })
@Entity('accounts', { schema: 'public' })
export class Accounts {
  @Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column('character varying', { name: 'email', unique: true, length: 255 })
  email: string;

  @Column('character varying', { name: 'password', length: 255 })
  password: string;

  @Column('enum', {
    name: 'status',
    nullable: true,
    enum: ['ACTIVE', 'PENDING', 'INACTIVE'],
    default: () => "'PENDING'",
  })
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE' | null;

  @ManyToOne(() => Roles, (roles) => roles.accounts)
  @JoinColumn([{ name: 'role_id', referencedColumnName: 'id' }])
  role: Roles;

  @OneToOne(() => Enterprises, (enterprises) => enterprises.account)
  enterprises: Enterprises;

  @OneToOne(() => Profiles, (profiles) => profiles.account)
  profiles: Profiles;
}
