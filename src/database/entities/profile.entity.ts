import { Column, Entity, JoinColumn, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import {
    AccountEntity,
    BaseEntity,
    WebsiteEntity,
    JobRecentlyEntity,
    JobEntity,
    UserRatingEntity,
    CvEntity,
} from '@database/entities';
import { AppliedJobEntity } from '@database/entities/applied-job.entity';
import { AddressEntity } from '@database/entities/address.entity';

export enum GenderType {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}
@Entity({ name: 'profiles' })
export class ProfileEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'profile_id' })
    readonly profileId: string;

    @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: false })
    readonly fullName: string;

    @Column({
        name: 'profile_url',
        type: 'varchar',
        length: 255,
        nullable: true,
        default: process.env.AVATAR_IMAGE_URL,
    })
    readonly avatarUrl: string;

    @Column({ name: 'page_url', type: 'varchar', length: 255, nullable: true, default: process.env.PAGE_IMAGE_URL })
    readonly pageUrl: string;

    @Column({ name: 'introduction', type: 'text', nullable: true })
    readonly introduction: string | null;

    @Column({ name: 'phone', type: 'varchar', length: 15, nullable: true })
    readonly phone: string | null;

    @Column({ name: 'view', type: 'int', default: 0, nullable: false })
    readonly view: number;

    @Column({
        name: 'gender',
        type: 'enum',
        enum: GenderType,
        enumName: 'gender_type',
        nullable: true,
    })
    readonly gender: GenderType | null;

    @Column({ name: 'education', type: 'text', nullable: true })
    readonly education: string | null;

    @Column({ name: 'is_premium', type: 'boolean', default: false, nullable: false })
    readonly isPremium: boolean;

    @Column({ name: 'expired_premium', type: 'date', nullable: true })
    readonly expiredPremium: Date | null;

    @Column({ name: 'experience', type: 'text', nullable: true })
    readonly experience: string | null;

    @Column({ name: 'account_id', type: 'uuid', nullable: false, unique: true })
    account_id: string;
    //     relationships
    @OneToOne(() => AccountEntity, (account) => account.profile)
    @JoinColumn({ name: 'account_id' })
    readonly account: AccountEntity;

    @OneToMany(() => WebsiteEntity, (website) => website.profile)
    readonly websites: WebsiteEntity[];

    @OneToMany(() => JobRecentlyEntity, (jobRecently) => jobRecently.profile)
    readonly jobsRecently: JobRecentlyEntity[];

    @ManyToMany(() => JobEntity, (job) => job.profiles)
    readonly jobs: JobEntity[];

    @OneToMany(() => UserRatingEntity, (userRating) => userRating.profile)
    readonly userRatings: UserRatingEntity[];

    @OneToMany(() => CvEntity, (cv) => cv.profile)
    readonly cvs: CvEntity[];

    @OneToMany(() => AppliedJobEntity, (appliedJob) => appliedJob.profile)
    readonly appliedJob: AppliedJobEntity[];

    @ManyToMany(() => AddressEntity, (address) => address.profiles)
    readonly addresses: AddressEntity[];
}
