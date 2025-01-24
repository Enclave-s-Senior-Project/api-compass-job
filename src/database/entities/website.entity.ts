import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity, ProfileEntity, EnterpriseEntity } from '@database/entities';

export enum SocialType {
    FACEBOOK = 'FACEBOOK',
    INSTAGRAM = 'INSTAGRAM',
    TWITTER = 'TWITTER',
    LINKEDIN = 'LINKEDIN',
    YOUTUBE = 'YOUTUBE',
}

@Entity('websites')
export class WebsiteEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'website_id' })
    readonly websiteId: string;

    @Column('enum', {
        name: 'social_type',
        enum: SocialType,
    })
    readonly socialType: SocialType | null;

    @Column('character varying', {
        name: 'social_link',
        length: 255,
    })
    readonly socialLink: string | null;

    // relationships
    @ManyToOne(() => EnterpriseEntity, (enterprise) => enterprise.websites)
    @JoinColumn({ name: 'enterprise_id' })
    readonly enterprise: EnterpriseEntity;

    @ManyToOne(() => ProfileEntity, (profile) => profile.websites)
    @JoinColumn({ name: 'profile_id' })
    readonly profile: ProfileEntity;
}
