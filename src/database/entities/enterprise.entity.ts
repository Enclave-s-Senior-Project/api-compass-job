import {
    BeforeInsert,
    BeforeUpdate,
    Column,
    Entity,
    Index,
    JoinColumn,
    JoinTable,
    ManyToMany,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import {
    AccountEntity,
    WebsiteEntity,
    BaseEntity,
    JobEntity,
    ProfileEntity,
    BoostedJobsEntity,
} from '@database/entities';
import { AddressEntity } from '@database/entities/address.entity';
import { EnterpriseStatus } from '@common/enums';
import { TransactionEntity } from './transaction.entity';

export enum OrganizationType {
    PRIVATE = 'PRIVATE',
    FLAT = 'FLAT',
    PUBLIC = 'PUBLIC',
    OUTSOURCE = 'OUTSOURCE',
}

export enum PREMIUM_TYPE {
    BASIC = 'TRIAL',
    STANDARD = 'STANDARD',
    PREMIUM = 'PREMIUM',
}

@Entity({ name: 'enterprises' })
export class EnterpriseEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'enterprise_id' })
    readonly enterpriseId: string;

    @Column({ name: 'name', type: 'varchar', length: 255, unique: true })
    readonly name: string;

    @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
    readonly email: string;

    @Column({ name: 'phone', type: 'varchar', length: 15, unique: true })
    readonly phone: string;

    @Column({ name: 'description', type: 'text', default: process.env.ENTERPRISE_DESCRIPTION })
    readonly description: string | null;

    @Column({ name: 'benefit', type: 'text', nullable: true })
    readonly benefit: string | null;

    @Column({ name: 'company_vision', type: 'text', nullable: true })
    readonly companyVision: string | null;

    @Column({ name: 'logo_url', type: 'varchar', length: 255, default: process.env.ENTERPRISE_LOGO_URL })
    readonly logoUrl: string;

    @Column({ name: 'boost_limit', type: 'int', default: 0 })
    boostLimit: number;

    @Column({
        name: 'background_image_url',
        type: 'varchar',
        length: 255,
        default: process.env.ENTERPRISE_LOGO_URL,
        nullable: true,
    })
    readonly backgroundImageUrl: string | null;

    @Column({ name: 'founded_in', type: 'date', nullable: true })
    readonly foundedIn: Date | null;

    @Column({ name: 'organization_type', type: 'enum', enum: OrganizationType, nullable: true })
    readonly organizationType: OrganizationType | null;

    @Column({ name: 'team_size', type: 'varchar', length: 50, nullable: true })
    readonly teamSize: string | null;

    @Column({
        name: 'status',
        type: 'enum',
        enum: EnterpriseStatus,
        nullable: false,
        default: EnterpriseStatus.PENDING,
    })
    readonly status: EnterpriseStatus;

    @Column({ name: 'categories', type: 'text', array: true, nullable: true })
    readonly categories: string[];

    @Column({ name: 'bio', type: 'text', nullable: true })
    bio: string | null;

    @Index('idx_enterprise_premium')
    @Column({ name: 'is_premium', type: 'boolean', default: false, nullable: false })
    isPremium: boolean;

    @Column({ name: 'total_points', type: 'int', default: 0, nullable: false })
    totalPoints: number;

    @Column({ name: 'is_trial', type: 'boolean', default: false, nullable: true })
    isTrial: boolean;

    // Relationships
    @OneToOne(() => AccountEntity, (account) => account.enterprise)
    @JoinColumn({ name: 'account_id' })
    readonly account: AccountEntity;

    @OneToMany(() => WebsiteEntity, (website) => website.enterprise)
    readonly websites: WebsiteEntity[];

    @OneToMany(() => JobEntity, (job) => job.enterprise)
    readonly jobs: JobEntity[];

    @ManyToMany(() => AddressEntity, (address) => address.enterprises)
    readonly addresses: AddressEntity[];

    @ManyToMany(() => ProfileEntity, (profile) => profile.enterprises)
    profiles: ProfileEntity[];

    @OneToMany(() => BoostedJobsEntity, (boostedJob) => boostedJob.enterprise)
    boostedJobs: BoostedJobsEntity[];

    @OneToMany(() => TransactionEntity, (transaction) => transaction.enterprise, { nullable: true })
    transactions: TransactionEntity[];

    @BeforeUpdate()
    checkPremiumStatus(): void {
        if (this.totalPoints === 0) {
            this.isPremium = false;
        }
    }
}
