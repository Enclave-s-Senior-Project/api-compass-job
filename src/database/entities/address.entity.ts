import { BeforeInsert, Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity, EnterpriseEntity, JobEntity, ProfileEntity } from '@database/entities';

@Entity({ name: 'addresses' })
export class AddressEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'address_id' })
    readonly addressId: string;

    @Column({ name: 'country', type: 'varchar', length: 100, nullable: false })
    readonly country: string;

    @Column({ name: 'city', type: 'varchar', length: 100, nullable: false })
    readonly city: string;

    @Column({ name: 'street', type: 'varchar', length: 255, nullable: false })
    readonly street: string;

    @Column({ name: 'zip_code', type: 'varchar', length: 10, nullable: false })
    readonly zipCode: string;

    @Column({ name: 'mixed_address', type: 'varchar', length: 255, nullable: false })
    mixedAddress: string;

    // relationships
    @ManyToMany(() => JobEntity, (job) => job.addresses)
    @JoinTable({ name: 'job_addresses', joinColumn: { name: 'address_id' }, inverseJoinColumn: { name: 'job_id' } })
    readonly jobs: JobEntity[];

    @ManyToMany(() => EnterpriseEntity, (enterprise) => enterprise.addresses)
    @JoinTable({
        name: 'enterprise_addresses',
        joinColumn: { name: 'address_id' },
        inverseJoinColumn: { name: 'enterprise_id' },
    })
    readonly enterprises: EnterpriseEntity[];

    @ManyToMany(() => ProfileEntity, (profile) => profile.addresses)
    @JoinTable({ name: 'profile_addresses', joinColumn: { name: 'job_id' }, inverseJoinColumn: { name: 'profile_id' } })
    readonly profiles: ProfileEntity[];

    @BeforeInsert()
    async generateMixedAddress() {
        this.mixedAddress = `${this.street}, ${this.city}, ${this.zipCode}, ${this.country}`;
    }
}
