import admin from 'firebase-admin';
import { Provider } from '@nestjs/common';

export const firebaseAdminProviderName = 'FIREBASE_ADMIN';

export const firebaseAdminProvider: Provider = {
    provide: firebaseAdminProviderName,
    useFactory: () => {
        const defaultApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });

        return { defaultApp };
    },
};
