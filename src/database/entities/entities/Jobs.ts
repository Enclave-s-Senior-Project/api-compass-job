import { Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { AppliedJobs } from './AppliedJobs';
import { JobAddresses } from './JobAddresses';
import { Categories } from './Categories';
import { JobFavorites } from './JobFavorites';
import { JobRecently } from './JobRecently';
import { Tags } from './Tags';
import { Addresses } from './Addresses';
import { Enterprises } from './Enterprises';
import { UserRatings } from './UserRatings';

@Index('jobs_pkey', ['id'], { unique: true })
@Entity('jobs', { schema: 'public' })
export class Jobs {
    @Column('uuid', { primary: true, name: 'id' })
    id: string;

    @Column('character varying', { name: 'name', length: 255 })
    name: string;

    @Column('numeric', {
        name: 'lowest_wage',
        nullable: true,
        precision: 10,
        scale: 2,
    })
    lowestWage: string | null;

    @Column('numeric', {
        name: 'highest_wage',
        nullable: true,
        precision: 10,
        scale: 2,
    })
    highestWage: string | null;

    @Column('text', { name: 'description', nullable: true })
    description: string | null;

    @Column('character varying', { name: 'type', nullable: true, length: 50 })
    type: string | null;

    @Column('integer', { name: 'experience', nullable: true })
    experience: number | null;

    @Column('date', { name: 'deadline', nullable: true })
    deadline: string | null;

    @Column('character varying', {
        name: 'intro_img',
        nullable: true,
        length: 255,
    })
    introImg: string | null;

    @Column('boolean', { name: 'status', nullable: true, default: () => 'false' })
    status: boolean | null;

    @OneToMany(() => AppliedJobs, (appliedJobs) => appliedJobs.job)
    appliedJobs: AppliedJobs[];

    @OneToMany(() => JobAddresses, (jobAddresses) => jobAddresses.job)
    jobAddresses: JobAddresses[];

    @ManyToMany(() => Categories, (categories) => categories.jobs)
    categories: Categories[];

    @OneToMany(() => JobFavorites, (jobFavorites) => jobFavorites.job)
    jobFavorites: JobFavorites[];

    @OneToMany(() => JobRecently, (jobRecently) => jobRecently.job)
    jobRecentlies: JobRecently[];

    @ManyToMany(() => Tags, (tags) => tags.jobs)
    @JoinTable({
        name: 'job_tags',
        joinColumns: [{ name: 'job_id', referencedColumnName: 'id' }],
        inverseJoinColumns: [{ name: 'tag_id', referencedColumnName: 'id' }],
        schema: 'public',
    })
    tags: Tags[];

    @ManyToOne(() => Addresses, (addresses) => addresses.jobs)
    @JoinColumn([{ name: 'address_id', referencedColumnName: 'id' }])
    address: Addresses;

    @ManyToOne(() => Enterprises, (enterprises) => enterprises.jobs)
    @JoinColumn([{ name: 'enterprise_id', referencedColumnName: 'id' }])
    enterprise: Enterprises;

    @OneToMany(() => UserRatings, (userRatings) => userRatings.job)
    userRatings: UserRatings[];
}
