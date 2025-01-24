import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity, ProfileEntity, RoleEntity, EnterpriseEntity } from '@database/entities';

export enum AccountStatusType {
    ACTIVE = 'ACTIVE',
    PENDING = 'PENDING',
    INACTIVE = 'INACTIVE',
}

@Entity({ name: 'accounts' })
export class AccountEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'account_id' })
    readonly accountId: string;

    @Column({ name: 'email', type: 'varchar', length: '255', unique: true })
    readonly email: string;

    @Column({ name: 'password', type: 'text' })
    readonly password: string;

    @Column({ name: 'status', type: 'enum', enum: AccountStatusType, default: AccountStatusType.PENDING })
    readonly status: AccountStatusType;

    // relationships
    @ManyToOne(() => RoleEntity, (role) => role.roleId)
    @JoinColumn({ name: 'role_id' })
    readonly role: RoleEntity;

    @OneToOne(() => ProfileEntity, (profile) => profile.account)
    readonly profile: ProfileEntity;

    @OneToOne(() => EnterpriseEntity, (enterprise) => enterprise.account)
    readonly enterprise: EnterpriseEntity;
}
