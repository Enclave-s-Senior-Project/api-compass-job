import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AccountEntity, BaseEntity } from '@database/entities/index';

@Entity({ name: 'roles' })
export class RoleEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'role_id' })
    readonly roleId: string;

    @Column({ name: 'role', type: 'varchar', length: 50, unique: true })
    readonly role: string;

    // relationships
    @OneToMany(() => AccountEntity, (account) => account.role)
    readonly accounts: AccountEntity[];
}
