import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { Jobs } from './Jobs';

@Index('tags_pkey', ['id'], { unique: true })
@Index('tags_name_key', ['name'], { unique: true })
@Entity('tags', { schema: 'public' })
export class Tags {
    @Column('uuid', { primary: true, name: 'id' })
    id: string;

    @Column('character varying', { name: 'name', unique: true, length: 255 })
    name: string;

    @ManyToMany(() => Jobs, (jobs) => jobs.tags)
    jobs: Jobs[];
}
