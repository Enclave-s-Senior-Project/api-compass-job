import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Enterprises } from './Enterprises';

@Index('websites_pkey', ['id'], { unique: true })
@Entity('websites', { schema: 'public' })
export class Websites {
  @Column('uuid', { primary: true, name: 'id' })
  id: string;

  @Column('enum', {
    name: 'social_type',
    nullable: true,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'],
  })
  socialType:
    | 'facebook'
    | 'instagram'
    | 'twitter'
    | 'linkedin'
    | 'youtube'
    | null;

  @Column('character varying', {
    name: 'social_link',
    nullable: true,
    length: 255,
  })
  socialLink: string | null;

  @ManyToOne(() => Enterprises, (enterprises) => enterprises.websites)
  @JoinColumn([{ name: 'enterprise_id', referencedColumnName: 'id' }])
  enterprise: Enterprises;
}
