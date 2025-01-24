import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AppliedJobs } from './AppliedJobs';
import { Profiles } from './Profiles';

@Index('cvs_pkey', ['id'], { unique: true })
@Entity('cvs', { schema: 'public' })
export class Cvs {
    @Column('uuid', { primary: true, name: 'id' })
    id: string;

    @Column('character varying', { name: 'url_cv', length: 255 })
    urlCv: string;

    @OneToMany(() => AppliedJobs, (appliedJobs) => appliedJobs.cv)
    appliedJobs: AppliedJobs[];

    @ManyToOne(() => Profiles, (profiles) => profiles.cvs)
    @JoinColumn([{ name: 'profile_id', referencedColumnName: 'id' }])
    profile: Profiles;
}
