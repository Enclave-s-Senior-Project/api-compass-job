import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity, EnterpriseEntity } from '@database/entities';
import { PAYMENT_STATUS, PREMIUM_TYPE } from './transaction.entity';

@Entity('history_transactions')
export class HistoryTransactionEntity extends BaseEntity {
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

    @Column({ name: 'premium_type', type: 'varchar', nullable: true })
    premiumType: PREMIUM_TYPE;

    @ManyToOne(() => EnterpriseEntity, (enterprise) => enterprise.historyTransactions, { nullable: true })
    @JoinColumn({ name: 'enterprise_id' })
    enterprise: EnterpriseEntity;
}
