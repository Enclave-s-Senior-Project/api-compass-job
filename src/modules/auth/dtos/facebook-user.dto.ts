export interface Oauth2User {
    providerId: string;
    provider: 'facebook' | 'google';
    email: string;
    name: string;
    photo?: string;
    accessToken?: string;
}
