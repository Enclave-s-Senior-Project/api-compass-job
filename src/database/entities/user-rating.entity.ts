import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EnterpriseEntity, BaseEntity, ProfileEntity } from '@database/entities';

@Entity({ name: 'user_ratings' })
export class UserRatingEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'user_rating_id' })
    readonly userRatingId: string;

    @Column({ name: 'rating', type: 'int', nullable: false })
    readonly rating: number;

    @Column({ name: 'comment', type: 'text', nullable: true })
    readonly comment: string | null;

    @ManyToOne(() => EnterpriseEntity, (enterprise) => enterprise.userRatings)
    @JoinColumn({ name: 'enterprise_id' })
    readonly enterprise: EnterpriseEntity;

    @ManyToOne(() => ProfileEntity, (profile) => profile.userRatings)
    @JoinColumn([{ name: 'profile_id' }])
    readonly profile: ProfileEntity;
}
