import { Column, Entity, JoinColumn, Check, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity, ProfileEntity, EnterpriseEntity } from '@database/entities';
import { arrayContains } from 'class-validator';

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    PENDING = 'PENDING',
    INACTIVE = 'INACTIVE',
    BLOCKED = 'BLOCKED',
}

export enum RoleType {
    USER = 'USER',
    ENTERPRISE = 'ENTERPRISE',
    ADMIN = 'ADMIN',
}
@Entity({ name: 'accounts' })
@Check(`roles && ARRAY['USER', 'ENTERPRISE', 'ADMIN']::text[]`)
export class AccountEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'account_id' })
    readonly accountId: string;

    @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
    readonly email: string;

    @Column({ name: 'password', type: 'text' })
    readonly password: string;

    @Column({ name: 'status', type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
    readonly status: UserStatus;

    // Fix: Use `text[]` instead of `simple-array`
    @Column({ name: 'roles', type: 'text', array: true, default: () => `ARRAY['USER']::text[]` })
    readonly roles: string[];

    @OneToOne(() => ProfileEntity, (profile) => profile.account)
    readonly profile: ProfileEntity;

    @OneToOne(() => EnterpriseEntity, (enterprise) => enterprise.account)
    readonly enterprise: EnterpriseEntity;
}
