import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity, JobEntity } from '@database/entities';

@Entity('tags')
export class TagEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'tag_id' })
    readonly tagId: string;

    @Column({ name: 'name', type: 'varchar', unique: true, length: 255 })
    readonly name: string;

    @ManyToMany(() => JobEntity, (job) => job.tags)
    jobs: JobEntity[];
}
