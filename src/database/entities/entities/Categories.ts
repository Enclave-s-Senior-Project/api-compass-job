import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Jobs } from './Jobs';

@Index('categories_pkey', ['id'], { unique: true })
@Entity('categories', { schema: 'public' })
export class Categories {
  @Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column('character varying', { name: 'name', length: 255 })
  name: string;

  @ManyToOne(() => Categories, (categories) => categories.categories)
  @JoinColumn([{ name: 'parent_id', referencedColumnName: 'id' }])
  parent: Categories;

  @OneToMany(() => Categories, (categories) => categories.parent)
  categories: Categories[];

  @ManyToMany(() => Jobs, (jobs) => jobs.categories)
  @JoinTable({
    name: 'job_categories',
    joinColumns: [{ name: 'category_id', referencedColumnName: 'id' }],
    inverseJoinColumns: [{ name: 'job_id', referencedColumnName: 'id' }],
    schema: 'public',
  })
  jobs: Jobs[];
}
