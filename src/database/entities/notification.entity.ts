import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { AccountEntity } from '.';

export enum NotificationType {
    JOB_EXPIRED = 'job_expired',
    JOB_APPLIED = 'job_applied',
    APPLICATION_ACCEPTED = 'application_accepted',
    APPLICATION_REJECTED = 'application_rejected',
    ENTERPRISE_REGISTRATION_APPROVED = 'enterprise_registration_approved',
    ENTERPRISE_REGISTRATION_REJECTED = 'enterprise_registration_rejected',
    ENTERPRISE_REGISTRATION_PENDING = 'enterprise_registration_pending',
    ENTERPRISE_REGISTRATION_BLOCKED = 'enterprise_registration_blocked',
    // ADD MORE WHEN NEEDED
}

@Entity({ name: 'notifications' })
export class NotificationEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    notificationId: string;

    @ManyToOne(() => AccountEntity, (account) => account.notification)
    @JoinColumn({ name: 'account_id' })
    account: AccountEntity;

    @Column({
        type: 'enum',
        enum: NotificationType,
    })
    type: NotificationType;

    @Column({ type: 'text', nullable: true })
    link: string;

    @Column({ type: 'varchar', nullable: false })
    title: string;

    @Column({ type: 'text', nullable: false })
    message: string;

    @Column({ type: 'boolean', default: false })
    isRead: boolean;
}
