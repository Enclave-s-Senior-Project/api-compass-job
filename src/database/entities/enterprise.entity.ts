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
import { AccountEntity, WebsiteEntity, BaseEntity, JobEntity, ProfileEntity } from '@database/entities';
import { AddressEntity } from '@database/entities/address.entity';
import { EnterpriseStatus } from '@common/enums';

export enum OrganizationType {
    PRIVATE = 'PRIVATE',
    FLAT = 'FLAT',
    PUBLIC = 'PUBLIC',
    OUTSOURCE = 'OUTSOURCE',
}

export enum PREMIUM_TYPE {
    BASIC = 'BASIC',
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

    @Column('varchar', { name: 'industry_type', length: 255, nullable: true })
    readonly industryType: string | null;

    @Column({ name: 'bio', type: 'text', nullable: true })
    bio: string | null;

    @Index('idx_enterprise_premium')
    @Column({ name: 'is_premium', type: 'boolean', default: false, nullable: false })
    isPremium: boolean;

    @Column({ name: 'premium_type', type: 'enum', enum: PREMIUM_TYPE, nullable: true })
    premiumType: PREMIUM_TYPE | null;

    @Column({ name: 'expired_premium', type: 'date', nullable: true })
    expiredPremium: Date | null;

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
    @BeforeInsert()
    @BeforeUpdate()
    setPremiumExpiration() {
        if (this.premiumType && !Object.values(PREMIUM_TYPE).includes(this.premiumType)) {
            throw new Error('Invalid premium type');
        }
        if (this.isPremium && this.premiumType) {
            const expirationDays = this.getExpirationDays(this.premiumType);
            const newExpiration = new Date();
            newExpiration.setDate(newExpiration.getDate() + expirationDays);
            this.expiredPremium = newExpiration;
            this.isPremium = true;
            this.boostLimit = this.getBoostLimit(this.premiumType); // Set boost limit based on premium type
        } else {
            this.expiredPremium = null;
            this.isPremium = false;
            this.boostLimit = 0; // Reset boost limit when not premium
        }
    }

    private getExpirationDays(premiumType: PREMIUM_TYPE): number {
        switch (premiumType) {
            case PREMIUM_TYPE.BASIC:
                return 30; // 1 month
            case PREMIUM_TYPE.STANDARD:
                return 90; // 3 months
            case PREMIUM_TYPE.PREMIUM:
                return 360; // 1 year
            default:
                return 0;
        }
    }

    private getBoostLimit(premiumType: PREMIUM_TYPE): number {
        switch (premiumType) {
            case PREMIUM_TYPE.BASIC:
                return 10; // Example: 5 boosts for BASIC
            case PREMIUM_TYPE.STANDARD:
                return 20; // Example: 15 boosts for STANDARD
            case PREMIUM_TYPE.PREMIUM:
                return 70; // Example: 50 boosts for PREMIUM
            default:
                return 0;
        }
    }
}
