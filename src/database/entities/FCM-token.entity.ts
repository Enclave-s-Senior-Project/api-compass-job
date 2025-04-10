import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne } from 'typeorm';
import { AccountEntity } from './account.entity';
import { BaseEntity } from './base.entity';

@Entity({ name: 'fcm_tokens' })
export class FCMTokenEntity extends BaseEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'token_id' })
    readonly tokenId: string;

    @Column({ name: 'token', type: 'text', unique: true })
    readonly token: string;

    @ManyToOne(() => AccountEntity, (account) => account.fcmTokens, {
        onDelete: 'CASCADE',
        nullable: false,
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'account_id' })
    readonly account: AccountEntity;
}
