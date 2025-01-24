import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Addresses } from './Addresses';
import { Jobs } from './Jobs';

@Index('job_addresses_job_id_address_id_key', ['addressId', 'jobId'], {
    unique: true,
})
@Index('job_addresses_pkey', ['id'], { unique: true })
@Entity('job_addresses', { schema: 'public' })
export class JobAddresses {
    @PrimaryGeneratedColumn({ type: 'integer', name: 'id' })
    id: number;

    @Column('uuid', { name: 'job_id', nullable: true, unique: true })
    jobId: string | null;

    @Column('uuid', { name: 'address_id', nullable: true, unique: true })
    addressId: string | null;

    @ManyToOne(() => Addresses, (addresses) => addresses.jobAddresses)
    @JoinColumn([{ name: 'address_id', referencedColumnName: 'id' }])
    address: Addresses;

    @ManyToOne(() => Jobs, (jobs) => jobs.jobAddresses)
    @JoinColumn([{ name: 'job_id', referencedColumnName: 'id' }])
    job: Jobs;
}
