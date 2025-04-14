import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { EnterpriseService } from '../enterprise/service/enterprise.service';
import { CacheService } from '@src/cache/cache.service';
import { TransactionRepository } from './repositories/transaction.repository';
import { PAYMENT_STATUS, PREMIUM_TYPE } from '@src/database/entities/transaction.entity';
import { TransactionResponseDtoBuilder } from './dtos/transaction-response.dto';

@Injectable()
export class TransactionService {
    constructor(
        private readonly enterpriseService: EnterpriseService,
        private readonly transactionRepo: TransactionRepository,
        private readonly cacheService: CacheService
    ) {}
    private async generateAccessToken(): Promise<string> {
        try {
            const response = await axios.post(
                `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
                'grant_type=client_credentials',
                {
                    headers: {
                        Authorization: `Basic ${Buffer.from(
                            `${process.env.CLIENT_ID_PAYPAL}:${process.env.SECRET_KEY_PAYPAL}`
                        ).toString('base64')}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            return response.data.access_token;
        } catch (error) {
            throw new Error(`Error generating PayPal access token: ${error.message}`);
        }
    }

    async createOrder(enterpiseId: string, premiumName: string, price: number) {
        try {
            const enterprise = await this.enterpriseService.findOneById(enterpiseId);
            if (!enterprise) {
                throw new Error('Enterprise not found');
            }
            const priceString = price.toFixed(2);
            const accessToken = await this.generateAccessToken();
            const response = await axios.post(
                `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
                {
                    intent: 'CAPTURE',
                    purchase_units: [
                        {
                            items: [
                                {
                                    name: premiumName,
                                    quantity: '1',
                                    unit_amount: {
                                        currency_code: 'USD',
                                        value: priceString,
                                    },
                                },
                            ],
                            amount: {
                                currency_code: 'USD',
                                value: priceString,
                                breakdown: {
                                    item_total: {
                                        currency_code: 'USD',
                                        value: priceString,
                                    },
                                },
                            },
                        },
                    ],
                    application_context: {
                        return_url: `${process.env.APP_BASE_URL}/api/v1/transaction/complete-order?premiumName=${premiumName}&enterpriseId=${enterpiseId}`,
                        cancel_url: process.env.APP_BASE_URL + '/api/v1/transaction/cancel-order',
                        shipping_preference: 'NO_SHIPPING',
                        user_action: 'PAY_NOW',
                        brand_name: 'JobCompass',
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const approvalLink = response.data.links.find((link) => link.rel === 'approve')?.href;
            return new TransactionResponseDtoBuilder().setValue(approvalLink).success().build();
        } catch (error) {
            console.log('error', error);
            throw new Error(`Error creating PayPal order: ${error.message}`);
        }
    }

    async capturePayment(orderId: string): Promise<any> {
        try {
            const accessToken = await this.generateAccessToken();

            const response = await axios.post(
                `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data;
        } catch (error) {
            throw new Error(`Error capturing PayPal payment for order ${orderId}: ${error.message}`);
        }
    }

    async getOrderDetails(orderId: string): Promise<any> {
        try {
            const accessToken = await this.generateAccessToken();

            const response = await axios.get(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data;
        } catch (error) {
            throw new Error(`Error fetching details for PayPal order ${orderId}: ${error.message}`);
        }
    }

    async getPaymentStatus(orderId: string): Promise<any> {
        try {
            const accessToken = await this.generateAccessToken();

            const response = await axios.get(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data.status;
        } catch (error) {
            throw new Error(`Error fetching payment status for order ${orderId}: ${error.message}`);
        }
    }

    async completeOrder(premiumName: string, enterpriseId: string) {
        try {
            const enterprise = await this.enterpriseService.findOneById(enterpriseId);
            if (!enterprise) {
                throw new Error('Enterprise not found');
            }
            if (premiumName === PREMIUM_TYPE.STANDARD) {
                await this.enterpriseService.updateEnterprisePayment(enterpriseId, true, 10, true);
                const transaction = this.transactionRepo.create({
                    pointsPurchased: 100,
                    amountPaid: 0,
                    paymentMethod: 'PayPal',
                    paymentStatus: PAYMENT_STATUS.COMPLETED,
                    premiumType: PREMIUM_TYPE.STANDARD,
                    enterprise,
                });
                await this.transactionRepo.save(transaction);
                return new TransactionResponseDtoBuilder().setValue(transaction).success().build();
            }
            await this.enterpriseService.updateEnterprisePayment(enterpriseId, true, 10, true);
            const transaction = this.transactionRepo.create({
                pointsPurchased: 100,
                amountPaid: 0,
                paymentMethod: 'PayPal',
                paymentStatus: PAYMENT_STATUS.COMPLETED,
                premiumType: PREMIUM_TYPE.PREMIUM,
                enterprise,
            });
            await this.transactionRepo.save(transaction);
            return new TransactionResponseDtoBuilder().setValue(transaction).success().build();
        } catch (error) {
            throw new Error(`Error fetching payment status for order `);
        }
    }
}
