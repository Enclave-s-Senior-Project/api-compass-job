const ImageKit = require('imagekit');

export const imagekitProviderName = 'IMAGEKIT_PROVIDER';

export const imagekitProvider = {
    provide: imagekitProviderName,
    useFactory: () =>
        new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        }),
};
