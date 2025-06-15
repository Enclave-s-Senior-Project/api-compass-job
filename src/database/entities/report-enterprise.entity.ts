// create a new entity for report enterprise
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EnterpriseEntity, BaseEntity, ProfileEntity } from '@database/entities';

export enum ReportEnterpriseStatus {
    PENDING = 'PENDING',
    REVIEWED = 'REVIEWED',
    RESOLVED = 'RESOLVED',
}

@Entity({ name: 'report_enterprises' })
export class ReportEnterpriseEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'report_enterprise_id' })
    readonly reportEnterpriseId: string;

    @Column({ name: 'reason', type: 'text', nullable: false })
    readonly reason: string;

    @Column({ name: 'status', type: 'enum', enum: ReportEnterpriseStatus, nullable: false })
    readonly status: ReportEnterpriseStatus;

    // admin note
    @Column({ name: 'admin_note', type: 'text', nullable: true })
    readonly adminNote: string | null;
    // file attachment is array url
    @Column({ name: 'file_attachment', type: 'jsonb', nullable: true })
    readonly fileAttachment: string[];

    @ManyToOne(() => EnterpriseEntity, (enterprise) => enterprise.reportEnterprises)
    @JoinColumn({ name: 'enterprise_id' })
    readonly enterprise: EnterpriseEntity;

    @ManyToOne(() => ProfileEntity, (profile) => profile.reportEnterprises)
    @JoinColumn([{ name: 'profile_id' }])
    readonly profile: ProfileEntity;
}
