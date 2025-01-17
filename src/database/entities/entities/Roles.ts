import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Accounts } from './Accounts';

@Index('roles_pkey', ['id'], { unique: true })
@Index('roles_role_key', ['role'], { unique: true })
@Entity('roles', { schema: 'public' })
export class Roles {
  @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
  id: number;

  @Column('character varying', { name: 'role', unique: true, length: 50 })
  role: string;

  @OneToMany(() => Accounts, (accounts) => accounts.role)
  accounts: Accounts[];
}
