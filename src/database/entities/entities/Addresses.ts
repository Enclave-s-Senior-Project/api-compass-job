import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Enterprises } from './Enterprises';
import { JobAddresses } from './JobAddresses';
import { Jobs } from './Jobs';
import { UserAddresses } from './UserAddresses';

@Index('addresses_pkey', ['id'], { unique: true })
@Entity('addresses', { schema: 'public' })
export class Addresses {
    @Column('uuid', { primary: true, name: 'id' })
    id: string;

    @Column('character varying', { name: 'country', nullable: true, length: 100 })
    country: string | null;

    @Column('character varying', { name: 'zip_code', nullable: true, length: 20 })
    zipCode: string | null;

    @Column('character varying', { name: 'city', nullable: true, length: 100 })
    city: string | null;

    @Column('character varying', { name: 'street', nullable: true, length: 255 })
    street: string | null;

    @OneToMany(() => Enterprises, (enterprises) => enterprises.address)
    enterprises: Enterprises[];

    @OneToMany(() => JobAddresses, (jobAddresses) => jobAddresses.address)
    jobAddresses: JobAddresses[];

    @OneToMany(() => Jobs, (jobs) => jobs.address)
    jobs: Jobs[];

    @OneToMany(() => UserAddresses, (userAddresses) => userAddresses.address)
    userAddresses: UserAddresses[];
}
