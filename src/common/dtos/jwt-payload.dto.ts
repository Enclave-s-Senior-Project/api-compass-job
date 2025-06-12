export interface JwtPayload {
    accountId: string;
    profileId: string;
    enterpriseId?: string;
    roles: string[];
}
