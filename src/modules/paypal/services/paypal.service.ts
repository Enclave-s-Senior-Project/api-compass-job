import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PaypalService {
    // Generate Access Token
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

    // Create Order
    async createOrder(): Promise<string> {
        try {
            const accessToken = await this.generateAccessToken();
            console.log('Access Token:', accessToken);
            const response = await axios.post(
                `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
                {
                    intent: 'CAPTURE',
                    purchase_units: [
                        {
                            items: [
                                {
                                    name: 'Node.js Complete Course',
                                    description: 'Node.js Complete Course with Express and MongoDB',
                                    quantity: 1,
                                    unit_amount: {
                                        currency_code: 'USD',
                                        value: '100',
                                    },
                                },
                            ],
                            amount: {
                                currency_code: 'USD',
                                value: '100',
                                breakdown: {
                                    item_total: {
                                        currency_code: 'USD',
                                        value: '100',
                                    },
                                },
                            },
                        },
                    ],
                    application_context: {
                        return_url: process.env.APP_BASE_URL + '/complete-order',
                        cancel_url: process.env.APP_BASE_URL + '/cancel-order',
                        shipping_preference: 'NO_SHIPPING',
                        user_action: 'PAY_NOW',
                        brand_name: 'manfra.io',
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
            return approvalLink;
        } catch (error) {
            console.log('error', error);
            throw new Error(`Error creating PayPal order: ${error.message}`);
        }
    }

    // Capture Payment
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

    // Get Order Details
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

    // Get Payment Status
    async getPaymentStatus(orderId: string): Promise<any> {
        try {
            const accessToken = await this.generateAccessToken();

            const response = await axios.get(`${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.data.status; // This will return the status of the payment
        } catch (error) {
            throw new Error(`Error fetching payment status for order ${orderId}: ${error.message}`);
        }
    }
}
