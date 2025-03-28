import { isUUID } from 'class-validator';

export class ValidationHelper {
    public static isValidateUUIDv4(id: string): boolean {
        return isUUID(id, '4');
    }
}
