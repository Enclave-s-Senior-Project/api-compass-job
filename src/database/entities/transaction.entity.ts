import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EnterpriseEntity } from '@database/entities';

export enum PAYMENT_STATUS {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export enum PREMIUM_TYPE {
    TRIAL = 'TRIAL',
    STANDARD = 'STANDARD',
    PREMIUM = 'PREMIUM',
}

@Entity('transactions')
export class TransactionEntity {
    @PrimaryGeneratedColumn('uuid', { name: 'id' })
    id: string;

    @Column({ name: 'points_purchased', type: 'int' })
    pointsPurchased: number;

    @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2 })
    amountPaid: number;

    @Column({ name: 'payment_method', type: 'varchar', nullable: true })
    paymentMethod?: string;

    @Column({
        name: 'payment_status',
        type: 'varchar',
        default: 'PENDING',
    })
    paymentStatus: PAYMENT_STATUS;

    @Column({ name: 'premium-type', type: 'varchar', nullable: true })
    premiumType: PREMIUM_TYPE;

    @ManyToOne(() => EnterpriseEntity, (enterprise) => enterprise.transactions, { nullable: true })
    @JoinColumn({ name: 'enterprise_id' })
    enterprise: EnterpriseEntity;
}
