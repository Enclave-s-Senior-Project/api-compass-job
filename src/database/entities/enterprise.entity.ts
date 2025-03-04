import { Column, Entity, JoinColumn, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AccountEntity, WebsiteEntity, BaseEntity, JobEntity } from '@database/entities';
import { AddressEntity } from '@database/entities/address.entity';
import { EnterpriseStatus } from '@common/enums';

enum OrganizationType {
    PRIVATE = 'PRIVATE',
    FLAT = 'FLAT',
    PUBLIC = 'PUBLIC',
    OUTSOURCE = 'OUTSOURCE',
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

    @Column({ name: 'enterprise_benefits', type: 'text' })
    readonly enterpriseBenefits: string | null;

    @Column({ name: 'company_vision', type: 'text' })
    readonly companyVision: string | null;

    @Column({ name: 'logo_url', type: 'varchar', length: 255, default: process.env.ENTERPRISE_LOGO_URL })
    readonly logoUrl: string;

    @Column({ name: 'founded_in', type: 'date' })
    readonly foundedIn: Date | null;

    @Column({ name: 'organization_type', type: 'enum', enum: OrganizationType })
    readonly organizationType: OrganizationType | null;

    @Column({ name: 'team_size', type: 'varchar', length: 50 })
    readonly teamSize: string | null;

    @Column({ name: 'status', type: 'enum', enum: EnterpriseStatus, nullable: false })
    readonly status: EnterpriseStatus;
    @Column('varchar', {
        name: 'industry_type',
        length: 255,
    })
    industryType: string | null;

    @Column({ name: 'bio', type: 'text' })
    bio: string | null;

    @Column({ name: 'is_premium', type: 'boolean', default: false, nullable: false })
    readonly isPremium: boolean;

    @Column({ name: 'expired_premium', type: 'date', nullable: true })
    readonly expiredPremium: Date | null;

    //     relationships
    @OneToOne(() => AccountEntity, (account) => account.enterprise)
    @JoinColumn({ name: 'account_id' })
    readonly account: AccountEntity;

    @OneToMany(() => WebsiteEntity, (website) => website.enterprise)
    readonly websites: WebsiteEntity[];

    @OneToMany(() => JobEntity, (job) => job.enterprise)
    readonly jobs: JobEntity[];

    @ManyToMany(() => AddressEntity, (address) => address.enterprises)
    readonly addresses: AddressEntity[];
}
