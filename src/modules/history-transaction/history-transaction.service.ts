import { Injectable } from '@nestjs/common';
import { HistoryTransactionRepository } from './repositories/history-transaction.repositories';
import { ErrorCatchHelper } from '@src/helpers/error-catch.helper';
import { EnterpriseEntity } from '@src/database/entities';
import { PAYMENT_STATUS, PREMIUM_TYPE } from '@src/database/entities/transaction.entity';

export const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

@Injectable()
export class HistoryTransactionService {
    constructor(private readonly historyTransactionRepo: HistoryTransactionRepository) {}
    async getMonthlyRevenue() {
        try {
            const currentYear = new Date().getFullYear();

            const result = await this.historyTransactionRepo

                .createQueryBuilder('transaction')

                .select("TO_CHAR(DATE_TRUNC('month', transaction.created_at), 'MM')", 'month')

                .addSelect('SUM(transaction.amount_paid)', 'revenue')

                .where('EXTRACT(YEAR FROM transaction.created_at) = :year', { year: currentYear })

                .groupBy("TO_CHAR(DATE_TRUNC('month', transaction.created_at), 'MM')")

                .orderBy('month', 'ASC')

                .getRawMany();

            const monthlyRevenue = monthNames.map((name, index) => ({
                name,

                revenue: 0,
            }));
            result.forEach((row) => {
                const monthIndex = parseInt(row.month, 10) - 1;

                monthlyRevenue[monthIndex].revenue = parseFloat(row.revenue) || 0;
            });

            return monthlyRevenue;
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }

    async create(
        pointsPurchased: number,
        amountPaid: number,
        paymentMethod: string,
        paymentStatus: PAYMENT_STATUS,
        premiumType: PREMIUM_TYPE,
        enterprise: EnterpriseEntity
    ) {
        try {
            const transaction = this.historyTransactionRepo.create({
                pointsPurchased: pointsPurchased,
                amountPaid: amountPaid,
                paymentMethod: paymentMethod,
                paymentStatus: paymentStatus,
                premiumType: premiumType,
                enterprise: enterprise,
            });
            await this.historyTransactionRepo.save(transaction);
        } catch (error) {
            throw ErrorCatchHelper.serviceCatch(error);
        }
    }
}
