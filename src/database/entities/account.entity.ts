import { Column, Entity, Check, OneToOne, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity, ProfileEntity, EnterpriseEntity, NotificationEntity, FCMTokenEntity } from '@database/entities';

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    PENDING = 'PENDING',
    INACTIVE = 'INACTIVE',
    BLOCKED = 'BLOCKED',
}

export enum RoleType {
    USER = 'USER',
    ENTERPRISE = 'ENTERPRISE',
    ADMIN = 'ADMIN',
}
@Entity({ name: 'accounts' })
@Check(`roles && ARRAY['USER', 'ENTERPRISE', 'ADMIN']::text[]`)
export class AccountEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'account_id' })
    readonly accountId: string;

    @Column({ name: 'facebook_id', type: 'varchar', length: 255, default: null, nullable: true })
    readonly facebookId: string;

    @Column({ name: 'google_id', type: 'varchar', length: 255, default: null, nullable: true })
    readonly googleId: string;

    @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
    readonly email: string;

    @Column({ name: 'password', type: 'text' })
    readonly password: string;

    @Column({ name: 'status', type: 'enum', enum: UserStatus, default: UserStatus.PENDING })
    readonly status: UserStatus;

    // Fix: Use `text[]` instead of `simple-array`
    @Column({ name: 'roles', type: 'text', array: true, default: () => `ARRAY['USER']::text[]` })
    readonly roles: string[];

    @OneToOne(() => ProfileEntity, (profile) => profile.account)
    readonly profile: ProfileEntity;

    @OneToOne(() => EnterpriseEntity, (enterprise) => enterprise.account)
    readonly enterprise: EnterpriseEntity;

    @OneToMany(() => NotificationEntity, (notification) => notification.account)
    readonly notification: NotificationEntity;

    @OneToMany(() => FCMTokenEntity, (fcmToken) => fcmToken.account)
    readonly fcmTokens: FCMTokenEntity[];
}
