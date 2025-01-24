import { BaseEntity } from '@database/entities';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'admin', name: 'roles' })
export class RoleEntity extends BaseEntity {
    @PrimaryGeneratedColumn({ name: 'id', type: 'integer' })
    id: number;

    @Column({
        name: 'name',
        type: 'varchar',
        unique: true,
        nullable: false,
        length: 50,
    })
    name: string;

    @Column({
        name: 'active',
        type: 'boolean',
        nullable: false,
        default: true,
    })
    active: boolean;

    constructor(role?: Partial<RoleEntity>) {
        super();
        Object.assign(this, role);
    }
}
